from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.kurikulum_mapel import KurikulumMapel
from app.models.mata_pelajaran import MataPelajaran
from app.models.tahun_ajaran import TahunAjaran
from app.enums import TingkatKelas
from app.dto.akademik.kurikulum_mapel_dto import (
    CreateKurikulumMapelDTO,
    BulkAssignKurikulumMapelDTO,
    UpdateKurikulumMapelDTO,
    KurikulumMapelResponseDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO


class KurikulumService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_kurikulum_mapel(self, request: CreateKurikulumMapelDTO) -> KurikulumMapelResponseDTO:
        # Validate mapel exists
        mapel = await self._get_mapel_or_404(request.mapel_id)
        await self._validate_tahun_ajaran(request.tahun_ajaran_id)

        # Check unique constraint
        existing = await self.db.execute(
            select(KurikulumMapel).where(
                KurikulumMapel.mapel_id == request.mapel_id,
                KurikulumMapel.tingkat == request.tingkat,
                KurikulumMapel.tahun_ajaran_id == request.tahun_ajaran_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject '{mapel.nama_mapel}' is already assigned to grade {request.tingkat.value} for this academic year",
            )

        km = KurikulumMapel(
            mapel_id=request.mapel_id,
            tahun_ajaran_id=request.tahun_ajaran_id,
            tingkat=request.tingkat,
            is_wajib=request.is_wajib,
            jam_override=request.jam_override,
        )
        self.db.add(km)
        await self.db.commit()
        await self.db.refresh(km)
        return self._to_dto(km)

    async def bulk_assign(self, request: BulkAssignKurikulumMapelDTO) -> list[KurikulumMapelResponseDTO]:
        await self._validate_tahun_ajaran(request.tahun_ajaran_id)

        results = []
        for mapel_id in request.mapel_ids:
            mapel = await self._get_mapel_or_404(mapel_id)

            # Skip if already assigned
            existing = await self.db.execute(
                select(KurikulumMapel).where(
                    KurikulumMapel.mapel_id == mapel_id,
                    KurikulumMapel.tingkat == request.tingkat,
                    KurikulumMapel.tahun_ajaran_id == request.tahun_ajaran_id,
                )
            )
            if existing.scalar_one_or_none():
                continue

            km = KurikulumMapel(
                mapel_id=mapel_id,
                tahun_ajaran_id=request.tahun_ajaran_id,
                tingkat=request.tingkat,
                is_wajib=request.is_wajib,
            )
            self.db.add(km)
            results.append(km)

        await self.db.commit()
        for km in results:
            await self.db.refresh(km)
        return [self._to_dto(km) for km in results]

    async def list_by_tahun_ajaran_and_tingkat(
        self, tahun_ajaran_id: UUID, tingkat: TingkatKelas
    ) -> list[KurikulumMapelResponseDTO]:
        result = await self.db.execute(
            select(KurikulumMapel).where(
                KurikulumMapel.tahun_ajaran_id == tahun_ajaran_id,
                KurikulumMapel.tingkat == tingkat,
            )
        )
        items = result.scalars().all()
        return [self._to_dto(km) for km in items]

    async def list_by_tahun_ajaran(self, tahun_ajaran_id: UUID) -> list[KurikulumMapelResponseDTO]:
        result = await self.db.execute(
            select(KurikulumMapel).where(
                KurikulumMapel.tahun_ajaran_id == tahun_ajaran_id,
            )
        )
        items = result.scalars().all()
        return [self._to_dto(km) for km in items]

    async def update_kurikulum_mapel(
        self, kurikulum_mapel_id: UUID, request: UpdateKurikulumMapelDTO
    ) -> KurikulumMapelResponseDTO:
        km = await self._get_km_or_404(kurikulum_mapel_id)
        update_data = request.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        for field, value in update_data.items():
            setattr(km, field, value)

        await self.db.commit()
        await self.db.refresh(km)
        return self._to_dto(km)

    async def delete_kurikulum_mapel(self, kurikulum_mapel_id: UUID) -> MessageResponseDTO:
        km = await self._get_km_or_404(kurikulum_mapel_id)
        await self.db.delete(km)
        await self.db.commit()
        return MessageResponseDTO(message="Curriculum subject assignment deleted")

    # ── Helpers ──────────────────────────────────────────────────────────────

    async def _get_km_or_404(self, kurikulum_mapel_id: UUID) -> KurikulumMapel:
        result = await self.db.execute(
            select(KurikulumMapel).where(KurikulumMapel.kurikulum_mapel_id == kurikulum_mapel_id)
        )
        km = result.scalar_one_or_none()
        if not km:
            raise HTTPException(status_code=404, detail="Curriculum-subject assignment not found")
        return km

    async def _get_mapel_or_404(self, mapel_id: UUID) -> MataPelajaran:
        result = await self.db.execute(
            select(MataPelajaran).where(MataPelajaran.mapel_id == mapel_id)
        )
        mapel = result.scalar_one_or_none()
        if not mapel:
            raise HTTPException(status_code=404, detail="Subject not found")
        return mapel

    async def _validate_tahun_ajaran(self, tahun_ajaran_id: UUID) -> None:
        result = await self.db.execute(
            select(TahunAjaran).where(TahunAjaran.tahun_ajaran_id == tahun_ajaran_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Academic year not found")

    def _to_dto(self, km: KurikulumMapel) -> KurikulumMapelResponseDTO:
        mapel = km.mapel
        return KurikulumMapelResponseDTO(
            kurikulum_mapel_id=km.kurikulum_mapel_id,
            mapel_id=km.mapel_id,
            tahun_ajaran_id=km.tahun_ajaran_id,
            tingkat=km.tingkat,
            is_wajib=km.is_wajib,
            jam_override=km.jam_override,
            mapel_nama=mapel.nama_mapel if mapel else None,
            kode_mapel=mapel.kode_mapel if mapel else None,
            kelompok=mapel.kelompok.value if mapel else None,
            jam_per_minggu=mapel.jam_per_minggu if mapel else None,
        )

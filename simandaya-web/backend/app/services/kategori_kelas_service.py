from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.akademik.kategori_kelas_dto import (
    CreateKategoriKelasDTO,
    KategoriKelasResponseDTO,
    UpdateKategoriKelasDTO,
)
from app.dto.akademik.kelas_dto import MessageResponseDTO
from app.models.kategori_kelas import KategoriKelas
from app.policy.kategori_kelas_policy import KategoriKelasPolicy
from app.repositoriy.kategori_kelas_repository import KategoriKelasRepository


class KategoriKelasService:
    def __init__(
        self,
        db: AsyncSession,
        repo: KategoriKelasRepository | None = None,
        policy: type[KategoriKelasPolicy] = KategoriKelasPolicy,
    ):
        self.repo = repo or KategoriKelasRepository(db)
        self.policy = policy

    @staticmethod
    def _to_dto(k: KategoriKelas) -> KategoriKelasResponseDTO:
        return KategoriKelasResponseDTO(
            kategori_kelas_id=k.kategori_kelas_id,
            kode=k.kode,
            nama=k.nama,
            is_active=k.is_active,
        )

    async def list_kategori(self) -> list[KategoriKelasResponseDTO]:
        items = await self.repo.list_all()
        return [self._to_dto(item) for item in items]

    async def create_kategori(self, request: CreateKategoriKelasDTO) -> KategoriKelasResponseDTO:
        try:
            kode = request.kode.strip().upper()
            nama = request.nama.strip()

            existing_kode = await self.repo.find_by_kode(kode)
            self.policy.ensure_kode_available(existing_kode, kode)

            existing_nama = await self.repo.find_by_nama(nama)
            self.policy.ensure_nama_available(existing_nama, nama)

            obj = KategoriKelas(
                kode=kode,
                nama=nama,
                is_active=request.is_active,
            )
            await self.repo.add(obj)
            await self.repo.commit()
            await self.repo.refresh(obj)
            return self._to_dto(obj)
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create kategori kelas: {str(e)}",
            )

    async def update_kategori(
        self, kategori_kelas_id: UUID, request: UpdateKategoriKelasDTO
    ) -> KategoriKelasResponseDTO:
        try:
            obj = await self.repo.find_by_id(kategori_kelas_id)
            self.policy.ensure_exists(obj, kategori_kelas_id)

            update_data = request.model_dump(exclude_unset=True)
            self.policy.ensure_payload(update_data)

            if "kode" in update_data:
                kode = update_data["kode"].strip().upper()
                if kode != obj.kode:
                    existing_kode = await self.repo.find_by_kode(kode)
                    self.policy.ensure_kode_available(existing_kode, kode)
                update_data["kode"] = kode

            if "nama" in update_data:
                nama = update_data["nama"].strip()
                if nama != obj.nama:
                    existing_nama = await self.repo.find_by_nama(nama)
                    self.policy.ensure_nama_available(existing_nama, nama)
                update_data["nama"] = nama

            for field, value in update_data.items():
                setattr(obj, field, value)

            await self.repo.commit()
            await self.repo.refresh(obj)
            return self._to_dto(obj)
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update kategori kelas: {str(e)}",
            )

    async def delete_kategori(self, kategori_kelas_id: UUID) -> MessageResponseDTO:
        try:
            obj = await self.repo.find_by_id(kategori_kelas_id)
            self.policy.ensure_exists(obj, kategori_kelas_id)
            await self.repo.delete(obj)
            await self.repo.commit()
            return MessageResponseDTO(message="Kategori kelas deleted successfully")
        except HTTPException:
            raise
        except Exception as e:
            await self.repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete kategori kelas: {str(e)}",
            )

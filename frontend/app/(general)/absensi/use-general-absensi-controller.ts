"use client";

import { useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAbsensiDate,
  shiftAbsensiDate,
  setAbsensiSearch,
  setIzinKeluarDate,
  shiftIzinKeluarDate,
  setIzinKeluarSearch,
  todayStr,
} from "@/store/slices/absensi";
import {
  useListPublicAttendanceQuery,
  useListPublicIzinKeluarQuery,
} from "@/api/public/absensi";

export function useGeneralAbsensiController() {
  const dispatch = useAppDispatch();
  const { absensiDate, absensiSearch, izinKeluarDate, izinKeluarSearch } =
    useAppSelector((s) => s.absensi);

  useEffect(() => {
    if (!absensiDate) dispatch(setAbsensiDate(todayStr()));
    if (!izinKeluarDate) dispatch(setIzinKeluarDate(todayStr()));
  }, [dispatch, absensiDate, izinKeluarDate]);

  const debouncedAbsensiSearch = useDebounce(absensiSearch, 400);
  const debouncedIzinSearch = useDebounce(izinKeluarSearch, 400);

  const { data: attendance = [], isFetching: fetchingAtt } =
    useListPublicAttendanceQuery(
      {
        tanggal: absensiDate,
        search: debouncedAbsensiSearch || undefined,
      },
      { skip: !absensiDate },
    );

  const { data: izinKeluar = [], isFetching: fetchingIzin } =
    useListPublicIzinKeluarQuery(
      {
        tanggal: izinKeluarDate,
        search: debouncedIzinSearch || undefined,
      },
      { skip: !izinKeluarDate },
    );

  return {
    absensiDate,
    absensiSearch,
    attendance,
    debouncedAbsensiSearch,
    debouncedIzinSearch,
    fetchingAtt,
    fetchingIzin,
    izinKeluar,
    izinKeluarDate,
    izinKeluarSearch,
    setAbsensiDateValue: (d: string) => dispatch(setAbsensiDate(d)),
    setAbsensiSearchValue: (v: string) => dispatch(setAbsensiSearch(v)),
    setIzinKeluarDateValue: (d: string) => dispatch(setIzinKeluarDate(d)),
    setIzinKeluarSearchValue: (v: string) => dispatch(setIzinKeluarSearch(v)),
    shiftAbsensiDateBy: (n: number) => dispatch(shiftAbsensiDate(n)),
    shiftIzinKeluarDateBy: (n: number) => dispatch(shiftIzinKeluarDate(n)),
  };
}


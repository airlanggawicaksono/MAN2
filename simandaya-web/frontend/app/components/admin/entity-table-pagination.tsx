"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EntityTablePaginationProps {
  skip: number;
  limit: number;
  total: number;
  itemLabel: string;
  onSkipChange: (nextSkip: number) => void;
}

export function EntityTablePagination({
  skip,
  limit,
  total,
  itemLabel,
  onSkipChange,
}: EntityTablePaginationProps) {
  if (total <= limit) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(skip / limit) + 1;

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-muted-foreground">
        Menampilkan {skip + 1}-{Math.min(skip + limit, total)} dari {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={skip === 0}
          onClick={() => onSkipChange(Math.max(0, skip - limit))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Sebelumnya
        </Button>
        <span className="text-sm">
          Hal {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={skip + limit >= total}
          onClick={() => onSkipChange(skip + limit)}
        >
          Berikutnya
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


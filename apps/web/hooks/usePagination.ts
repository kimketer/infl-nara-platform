import { useState, useMemo } from 'react';

interface UsePaginationProps {
  totalCount: number;
  initialPage?: number;
  initialSize?: number;
}

interface UsePaginationResult {
  pageNo: number;
  setPageNo: (page: number) => void;
  numOfRows: number;
  setNumOfRows: (size: number) => void;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

export function usePagination({
  totalCount,
  initialPage = 1,
  initialSize = 10
}: UsePaginationProps): UsePaginationResult {
  const [pageNo, setPageNo] = useState(initialPage);
  const [numOfRows, setNumOfRows] = useState(initialSize);

  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / numOfRows);
  }, [totalCount, numOfRows]);

  const hasNextPage = useMemo(() => {
    return pageNo < totalPages;
  }, [pageNo, totalPages]);

  const hasPrevPage = useMemo(() => {
    return pageNo > 1;
  }, [pageNo]);

  const startIndex = useMemo(() => {
    return (pageNo - 1) * numOfRows + 1;
  }, [pageNo, numOfRows]);

  const endIndex = useMemo(() => {
    return Math.min(pageNo * numOfRows, totalCount);
  }, [pageNo, numOfRows, totalCount]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPageNo(page);
    }
  };

  const handleSizeChange = (size: number) => {
    setNumOfRows(size);
    setPageNo(1); // 페이지 크기가 변경되면 첫 페이지로 이동
  };

  return {
    pageNo,
    setPageNo: handlePageChange,
    numOfRows,
    setNumOfRows: handleSizeChange,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex
  };
} 
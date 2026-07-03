export interface IPaginationProps {
    data: string[];
  onPageChange: (pageNumber: number) => void;
    itemsPerPage?: number;
  }

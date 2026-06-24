export interface IPaginationProps {
    data: string[];
    onPageChange: (items: string[]) => void;
    itemsPerPage?: number;
  }

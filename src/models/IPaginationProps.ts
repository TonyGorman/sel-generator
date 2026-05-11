export interface IPaginationProps {
    data:string[],
    onPageChange:(item?: string[]) => void;
    itemsPerPage?: number;
  }

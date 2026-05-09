import * as React from 'react';
import styles from './Pagination.module.scss';
import { IPaginationProps } from '../models/IPaginationProps';

const Pagination = (props:IPaginationProps): React.ReactElement => {
    const { data, onPageChange } = props;
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 35;

    const totalPages = Math.ceil(data.length / itemsPerPage);



    const handleClick = (number: number):void => setCurrentPage(number);

    React.useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
            return;
        }

        const pageToRender = totalPages === 0 ? 1 : currentPage;
        const indexOfLastItem = pageToRender * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
        onPageChange(currentItems)
    }, [currentPage, data, onPageChange, totalPages])

    return (
        <div className={styles.pagination}>
            <span>Pages:</span>
            {[...Array(totalPages)].map((_, i) => (
                <button
                    key={i + 1}
                    onClick={() => handleClick(i + 1)}
                    className={currentPage === i + 1 ? styles.activePage : styles.pagenum}
                >
                    {i + 1}
                </button>
            ))}
        </div>)

}

export default Pagination;

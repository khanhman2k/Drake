import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import TableContainer from '@material-ui/core/TableContainer';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import clsx from 'clsx';
import WipDetailModal from './WipDetailModal';
import Tooltip from '@material-ui/core/Tooltip';
import ButtonBase from '@material-ui/core/ButtonBase';
const useStyles = makeStyles(theme => ({
    container: {
        height: 'calc(100vh - 300px)',
    },
    tableContainer: {
        maxHeight: '100%',
        height: '100%',
    },
    messageBox: {},
    message: {},
    sticky: {
        position: "sticky",
        left: 0,
        background: "white",
        zIndex: 999,
        boxShadow: "5px 2px 5px grey"
    },
}));

//https://stackoverflow.com/questions/51071144/how-to-customize-material-ui-table-row-and-columns-sticky
//https://thewebdev.info/2022/01/02/how-to-make-react-material-ui-table-row-and-columns-sticky/
const StickyTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
        left: 0,
        position: "sticky",
        zIndex: theme.zIndex.appBar + 2,
        whiteSpace: 'nowrap',
    },
    body: {
        backgroundColor: "#ddd",
        minWidth: "30px",
        left: 0,
        position: "sticky",
        zIndex: theme.zIndex.appBar + 1,
        whiteSpace: 'nowrap',
    }
}))(TableCell);
const StyledTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white
    },
    body: {
        fontSize: 14
    }
}))(TableCell);
const StyledTableRow = withStyles((theme) => ({
    root: {
        "&:nth-of-type(odd)": {
            backgroundColor: theme.palette.action.hover
        }
    }
}))(TableRow);
const sortByIndex = (items) =>
    [...items].sort((a, b) => a.index - b.index);

const WipDataGrid = (props) => {
    const { rows = [], summaries = [], columns = [] } = props;
    const [open, setOpen] = useState(false);
    const [stickyOffsets, setStickyOffsets] = useState([]);
    const tableRef = useRef(null);

    const [selectedItem, setSelectedItem] = useState({
        line_name: '',
        mo_number: '',
        wip_group: '',
    });

    const classes = useStyles();

    const fixedColumns = useMemo(
        () => sortByIndex(columns.filter(col => col.fixed === true)),
        [columns]
    );
    const nonFixedColumns = useMemo(
        () => sortByIndex(columns.filter(col => col.fixed !== true)),
        [columns]
    );

    useLayoutEffect(() => {
        if (!tableRef.current) {
            return;
        }
        const headerCells = tableRef.current.querySelectorAll('th[data-sticky="true"]');
        let offset = 0;
        const offsets = Array.from(headerCells).map((cell) => {
            const left = offset;
            offset += cell.offsetWidth;
            return left;
        });
        setStickyOffsets(offsets);
    }, [fixedColumns.length, nonFixedColumns.length, rows.length]);

    return (
        <>
            <div className={classes.container}>{
                rows && rows.length > 0 ?
                    (<TableContainer className={classes.tableContainer}>
                        <Table size='small' stickyHeader aria-label="sticky table" ref={tableRef}>
                            <TableHead style={{
                                whiteSpace: 'nowrap',
                            }}>
                                <TableRow>
                                    {fixedColumns.map((col, colIndex) => (
                                        <StickyTableCell
                                            key={col.field || colIndex}
                                            data-sticky="true"
                                            style={{ left: stickyOffsets[colIndex] || 0 }}
                                        >
                                            {col.title}
                                        </StickyTableCell>
                                    ))}
                                    {nonFixedColumns.map((col, colIndex) => (
                                        <StyledTableCell
                                            key={col.field || colIndex}
                                            className={clsx({
                                                [classes.sticky]: col.fixed
                                            })}
                                        >
                                            {col.title}
                                        </StyledTableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows && rows.map((row, rowIndex) => {
                                    return (
                                        <StyledTableRow key={rowIndex}>
                                            {fixedColumns.map((col, colIndex) => (
                                                <StickyTableCell
                                                    key={`${rowIndex}-${colIndex}`}
                                                    style={{ left: stickyOffsets[colIndex] || 0 }}
                                                >
                                                    {row[col.field]}
                                                </StickyTableCell>
                                            ))}
                                            {nonFixedColumns.map((col, colIndex) => {
                                                if (col.isWip) {
                                                    const wipGroup = Array.isArray(row.wips)
                                                        ? row.wips.find(w => w.wip_group === col.field)
                                                        : null;
                                                    const count = wipGroup?.count ?? 0;
                                                    const wipGroupName = col.title || col.field;
                                                    if (count !== 0) {
                                                        return (
                                                            <StyledTableCell key={col.field || colIndex}>
                                                                <Tooltip title={`${count}`}>
                                                                    <ButtonBase
                                                                        onClick={() => {
                                                                            setSelectedItem({
                                                                                line_name: row.line_name,
                                                                                mo_number: row.mo_number,
                                                                                wip_group: wipGroupName,
                                                                            });
                                                                            setOpen(true);
                                                                        }}
                                                                    >
                                                                        {count}
                                                                    </ButtonBase>
                                                                </Tooltip>
                                                            </StyledTableCell>
                                                        );
                                                    }
                                                    return (
                                                        <StyledTableCell key={col.field || colIndex}>
                                                            {count}
                                                        </StyledTableCell>
                                                    );
                                                }

                                                return (
                                                    <StyledTableCell key={col.field || colIndex}>
                                                        {row[col.field]}
                                                    </StyledTableCell>
                                                );
                                            })}
                                        </StyledTableRow>
                                    );
                                })}

                                <TableRow>
                                    {fixedColumns.map((col, colIndex) => (
                                        <StickyTableCell
                                            key={`summary-${colIndex}`}
                                            style={{ left: stickyOffsets[colIndex] || 0 }}
                                        >
                                            {colIndex === 0 ? 'Subtotal' : ''}
                                        </StickyTableCell>
                                    ))}
                                    {nonFixedColumns.map((col, colIndex) => {
                                        if (typeof col.summary === 'function') {
                                            return (
                                                <StyledTableCell key={col.field || colIndex}>
                                                    {col.summary(rows)}
                                                </StyledTableCell>
                                            );
                                        }

                                        if (col.isWip) {
                                            const wipGroup = summaries.find(w => w.wip_group === col.field);
                                            return (
                                                <StyledTableCell key={col.field || colIndex}>
                                                    {wipGroup ? wipGroup.total : 0}
                                                </StyledTableCell>
                                            );
                                        }

                                        return <StyledTableCell key={col.field || colIndex} />;
                                    })}
                                </TableRow>
                            </TableBody>
                        </Table>

                    </TableContainer >
                    )
                    :

                    <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        height='100%'
                        width='100%'>
                        <Typography variant='h1'>
                            No Data
                        </Typography>
                    </Box>
            }
            </div>
            {open && <WipDetailModal selectedItem={selectedItem} open={open} onClose={() => {
                setOpen(false);
            }} />}
        </>
    );
};

export default WipDataGrid;

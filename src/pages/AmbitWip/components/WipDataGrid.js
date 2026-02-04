import React from 'react';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableFooter from '@material-ui/core/TableFooter';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

const sortByIndex = (items) =>
    [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

const buildSummaryMap = (summaries) =>
    new Map(
        summaries.map((item) => [item.wip_group ?? item.field, item.total ?? 0])
    );

const resolveRowKey = (row, index) =>
    row.id ?? row.mo_number ?? `${row.model_name ?? 'row'}-${index}`;

const WipDataGrid = ({ rows = [], columns = [], summaries = [] }) => {
    const wipColumnGroup = columns.find((col) => col.field === 'wips');
    const wipColumns = wipColumnGroup?.wips ? sortByIndex(wipColumnGroup.wips) : [];
    const fixedColumns = sortByIndex(columns.filter((col) => col.field !== 'wips'));
    const hasWips = wipColumns.length > 0;
    const summaryMap = buildSummaryMap(summaries);
    const hasFooter =
        summaries.length > 0 || fixedColumns.some((col) => typeof col.summary === 'function');

    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {fixedColumns.map((col) => (
                            <TableCell
                                key={col.field}
                                component="th"
                                scope="col"
                                rowSpan={hasWips ? 2 : 1}
                            >
                                {col.title}
                            </TableCell>
                        ))}
                        {hasWips && (
                            <TableCell component="th" scope="col" colSpan={wipColumns.length}>
                                {wipColumnGroup?.title ?? 'Wips'}
                            </TableCell>
                        )}
                    </TableRow>
                    {hasWips && (
                        <TableRow>
                            {wipColumns.map((col) => (
                                <TableCell key={col.field} component="th" scope="col">
                                    {col.title}
                                </TableCell>
                            ))}
                        </TableRow>
                    )}
                </TableHead>
                <TableBody>
                    {rows.map((row, rowIndex) => (
                        <TableRow key={resolveRowKey(row, rowIndex)}>
                            {fixedColumns.map((col) => (
                                <TableCell key={`${rowIndex}-${col.field}`}>
                                    {row[col.field] ?? ''}
                                </TableCell>
                            ))}
                            {wipColumns.map((col) => {
                                const wipItem = Array.isArray(row.wips)
                                    ? row.wips.find((item) => item.wip_group === col.field)
                                    : null;
                                const value = wipItem ? wipItem.count : 0;
                                return (
                                    <TableCell key={`${rowIndex}-${col.field}`}>
                                        {value}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
                {hasFooter && (
                    <TableFooter>
                        <TableRow>
                            {fixedColumns.map((col, colIndex) => {
                                let value = '';
                                if (colIndex === 0) {
                                    value = 'Total';
                                } else if (typeof col.summary === 'function') {
                                    value = col.summary(rows);
                                }
                                return (
                                    <TableCell key={`summary-${col.field}`}>
                                        {value}
                                    </TableCell>
                                );
                            })}
                            {wipColumns.map((col) => (
                                <TableCell key={`summary-${col.field}`}>
                                    {summaryMap.get(col.field) ?? 0}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </TableContainer>
    );
};

export default WipDataGrid;

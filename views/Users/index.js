import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { useSnackbar } from 'notistack';
import useLoading from '../../hooks/useLoading';
import axios from 'axios';
import { getErrorMessage } from '../../utils/errorHandler';
import { useSearchParams } from 'react-router-dom';
import Paper from '@material-ui/core/Paper';
import TableContainer from '@material-ui/core/TableContainer';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import TablePagination from '@material-ui/core/TablePagination';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import FilterListIcon from '@material-ui/icons/FilterList';
import Button from '@material-ui/core/Button';
import ClearIcon from '@material-ui/icons/Clear';
import useAuth from '../../hooks/useAuth';
import { hasPermission } from '../../auth/authRoles';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import Box from '@material-ui/core/Box';
import { MdDownload, MdUpload, MdAdd } from 'react-icons/md';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import CircularProgress from '@material-ui/core/CircularProgress';

const AddOrEditUserModal = lazy(() => import('./components/AddOrEditUserModal'));
const UploadFileModal = lazy(() => import('../../components/UploadFileModal'));

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    paper: {
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
        backgroundColor: theme.palette.background.paper,
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: theme.spacing(1.5),
        padding: theme.spacing(2),
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: 'linear-gradient(180deg, #f9fbff 0%, #f5f8ff 100%)',
    },
    titleBlock: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.5),
    },
    pageTitle: {
        fontWeight: 700,
        color: '#13274a',
        lineHeight: 1.2,
    },
    pageSubtitle: {
        color: theme.palette.text.secondary,
        maxWidth: 580,
    },
    toolbarActions: {
        display: 'flex',
        gap: theme.spacing(1),
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    summaryChip: {
        fontWeight: 600,
        backgroundColor: '#e7f0ff',
        color: '#1c3f7a',
    },
    actionButton: {
        borderRadius: 10,
        textTransform: 'none',
        fontWeight: 600,
        paddingLeft: theme.spacing(1.5),
        paddingRight: theme.spacing(1.5),
    },
    tableContainer: {
        maxHeight: 'calc(100vh - 320px)',
        minHeight: 280,
    },
    actionHeader: {
        minWidth: 120,
    },
    actionCell: {
        whiteSpace: 'nowrap',
        minWidth: 120,
    },
    actionButtons: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
    },
    headerRowFilter: {
        backgroundColor: '#fafbfe',
    },
    filterCell: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
    filterInput: {
        width: 190,
        '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#fff',
        },
    },
    passwordWrapper: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
    },
    emptyRowCell: {
        textAlign: 'center',
        color: theme.palette.text.secondary,
        padding: theme.spacing(5, 2),
    },
    pagination: {
        borderTop: `1px solid ${theme.palette.divider}`,
    },
    dialogDescription: {
        marginTop: theme.spacing(0.5),
        color: theme.palette.text.secondary,
    },
    lazyFallback: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 80,
        width: '100%',
    },
}));

const StyledTableCell = withStyles(theme => ({
    head: {
        backgroundColor: '#eef3fb',
        color: '#183867',
        fontWeight: 700,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    body: {
        fontSize: 13,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
}))(TableCell);

const StyledTableRow = withStyles(() => ({
    root: {
        '&:nth-of-type(odd)': {
            backgroundColor: '#fcfdff',
        },
        '&:hover': {
            backgroundColor: '#f5f9ff',
        },
    },
}))(TableRow);

const parseNumberParam = (value, fallbackValue) => {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isNaN(parsed) ? fallbackValue : parsed;
};

const hasValue = value => value !== undefined && value !== null && value !== '';

const formatDateTime = value => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    const pad = number => String(number).padStart(2, '0');
    const hours = date.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;

    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(hour12)}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${period}`;
};

const renderAction = (row, actions, classes) => {
    if (!actions || actions.length === 0) {
        return null;
    }

    return (
        <TableCell className={classes.actionCell}>
            <Box className={classes.actionButtons}>
                {actions.map((action, actionIndex) => {
                    const isVisible = action.visible || action.visible === undefined;
                    if (!isVisible) {
                        return null;
                    }

                    const actionButton = (
                        <IconButton
                            size='small'
                            disabled={action.disabled}
                            onClick={event => action.onClick && action.onClick(event, row)}
                        >
                            {action.icon && action.icon()}
                        </IconButton>
                    );

                    if (action.toolTip) {
                        return (
                            <Tooltip key={actionIndex} title={action.toolTip}>
                                <span>{actionButton}</span>
                            </Tooltip>
                        );
                    }

                    return <span key={actionIndex}>{actionButton}</span>;
                })}
            </Box>
        </TableCell>
    );
};

const TableCellEx = ({ row, col, colIndex, canShowPassword, classes }) => {
    const [showPassword, setShowPassword] = useState(false);
    const rawValue = row[col.field];

    if (typeof col.render === 'function') {
        return (
            <TableCell key={colIndex} style={col.cellStyle}>
                {col.render(row)}
            </TableCell>
        );
    }

    if (hasValue(rawValue) && col.type === 'datetime') {
        return (
            <TableCell key={colIndex} style={col.cellStyle}>
                {formatDateTime(rawValue)}
            </TableCell>
        );
    }

    if (col.type === 'password') {
        return (
            <TableCell key={colIndex} style={col.cellStyle}>
                <Box className={classes.passwordWrapper}>
                    {hasValue(rawValue) ? (showPassword ? rawValue : '**********') : '-'}
                    <Tooltip title={showPassword ? 'Hide Password' : 'Show Password'}>
                        <span>
                            <IconButton
                                size='small'
                                disabled={!canShowPassword}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <VisibilityIcon fontSize='small' /> : <VisibilityOffIcon fontSize='small' />}
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </TableCell>
        );
    }

    return (
        <TableCell key={colIndex} style={col.cellStyle}>
            {hasValue(rawValue) ? rawValue : '-'}
        </TableCell>
    );
};

const TableRowEx = ({ columns, row, actions, classes, canShowPassword }) => (
    <StyledTableRow>
        {renderAction(row, actions, classes)}
        {columns.map((col, colIndex) => (
            <TableCellEx
                key={colIndex}
                row={row}
                col={col}
                colIndex={colIndex}
                canShowPassword={canShowPassword}
                classes={classes}
            />
        ))}
    </StyledTableRow>
);

const renderRow = (columns, rows, actions, classes, canShowPassword) => {
    if (!rows || rows.length === 0) {
        return (
            <TableRow>
                <TableCell
                    className={classes.emptyRowCell}
                    colSpan={columns.length + (actions && actions.length > 0 ? 1 : 0)}
                >
                    No users found. Try changing your filter or add a new user.
                </TableCell>
            </TableRow>
        );
    }

    return rows.map((row, rowIndex) => (
        <TableRowEx
            key={row.emp_no || rowIndex}
            columns={columns}
            row={row}
            actions={actions}
            classes={classes}
            canShowPassword={canShowPassword}
        />
    ));
};

const UserManager = () => {
    const { showLoading } = useLoading();
    const { enqueueSnackbar } = useSnackbar();
    const [searchParams, setSearchParams] = useSearchParams();
    const classes = useStyles();
    const [open, setOpen] = useState(false);
    const [openImport, setOpenImport] = useState(false);
    const [openImportOwner, setOpenImportOwner] = useState(false);
    const [openDialogDownload, setOpenDialogDownload] = useState(false);
    const [openDialogUpload, setOpenDialogUpload] = useState(false);
    const lastFetchKeyRef = useRef('');

    const initialUsername = searchParams.get('username') || '';
    const [filters, setFilters] = useState({
        username: initialUsername,
    });
    const [selectedItem, setSelectedItem] = useState(null);
    const [rowState, setRowState] = useState({
        pageNumber: parseNumberParam(searchParams.get('pageNumber'), 0),
        pageSize: parseNumberParam(searchParams.get('pageSize'), 15),
        totalCount: 0,
        items: [],
        filters: {
            username: initialUsername,
        },
    });

    const { user } = useAuth();

    const canAdd = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['ADD'],
        },
    });

    const canEdit = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['EDIT'],
        },
    });

    const canDelete = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['DELETE'],
        },
    });

    const canImport = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['IMPORT'],
        },
    });

    const canImportOwner = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['IMPORT_OWNER'],
        },
    });

    const canShowPassword = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['SHOW_PASSWORD'],
        },
    });

    const isAdministrator = hasPermission({
        user,
        roles: ['Administrator'],
    });

    const canUploadAny = canImport || canImportOwner || isAdministrator;

    const handleCloseDialogDownload = () => {
        setOpenDialogDownload(false);
    };

    const handleCloseDialogUpload = () => {
        setOpenDialogUpload(false);
    };

    const fetchUsers = useCallback(async (force = false) => {
        const queryKey = `${rowState.pageSize}|${rowState.pageNumber}|${rowState.filters.username || ''}`;
        if (!force && lastFetchKeyRef.current === queryKey) {
            return;
        }

        lastFetchKeyRef.current = queryKey;
        showLoading(true);

        try {
            const usernameQuery = encodeURIComponent(rowState.filters.username || '');
            const response = await axios.get(
                `/api/users?pageSize=${rowState.pageSize}&pageNumber=${rowState.pageNumber}&username=${usernameQuery}`
            );
            const data = response.data || {};
            setRowState(prevState => ({
                ...prevState,
                totalCount: data.totalCount || 0,
                items: data.items || [],
            }));
        } catch (err) {
            lastFetchKeyRef.current = '';
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error',
            });
        } finally {
            showLoading(false);
        }
    }, [enqueueSnackbar, rowState.filters.username, rowState.pageNumber, rowState.pageSize, showLoading]);

    const handleChangePage = (event, newPage) => {
        setRowState(prevState => ({
            ...prevState,
            pageNumber: newPage,
        }));
    };

    const handleChangeRowsPerPage = event => {
        setRowState(prevState => ({
            ...prevState,
            pageNumber: 0,
            pageSize: Number(event.target.value),
        }));
    };

    const renderHeader = (columns, actions) => (
        <TableRow>
            {actions && actions.length > 0 && <StyledTableCell className={classes.actionHeader}>Actions</StyledTableCell>}
            {columns.map((col, colIndex) => (
                <StyledTableCell key={colIndex} style={col.headerStyle}>
                    {col.title}
                </StyledTableCell>
            ))}
        </TableRow>
    );

    const renderHeaderFilter = (columns, actions) => {
        const isNeedFiltered = columns.some(col => typeof col.filterComponent === 'function');
        if (!isNeedFiltered) {
            return null;
        }

        return (
            <TableRow className={classes.headerRowFilter}>
                {actions && actions.length > 0 && <TableCell className={classes.filterCell} />}
                {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={classes.filterCell}>
                        {typeof column.filterComponent === 'function' ? column.filterComponent({ column }) : null}
                    </TableCell>
                ))}
            </TableRow>
        );
    };

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        document.title = 'User Manager';
    }, []);

    useEffect(() => {
        const pageNumber = String(rowState.pageNumber);
        const pageSize = String(rowState.pageSize);
        const username = rowState.filters.username || '';
        const isQueryChanged =
            searchParams.get('pageNumber') !== pageNumber ||
            searchParams.get('pageSize') !== pageSize ||
            searchParams.get('username') !== username;

        if (!isQueryChanged) {
            return;
        }

        setSearchParams({
            pageNumber,
            pageSize,
            username,
        });
    }, [rowState.pageNumber, rowState.pageSize, rowState.filters.username, searchParams, setSearchParams]);

    const columns = [
        {
            field: 'emp_no',
            title: 'Emp No',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
            filterComponent: () => (
                <TextField
                    className={classes.filterInput}
                    name='username'
                    size='small'
                    variant='outlined'
                    placeholder='Type then press Enter'
                    value={filters.username}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position='start'>
                                <Tooltip title='Filter Emp No'>
                                    <FilterListIcon fontSize='small' />
                                </Tooltip>
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <IconButton
                                title='Clear'
                                aria-label='Clear'
                                size='small'
                                style={{ visibility: filters.username ? 'visible' : 'hidden' }}
                                onClick={() => {
                                    setFilters(prevState => ({
                                        ...prevState,
                                        username: '',
                                    }));
                                    setRowState(prevState => ({
                                        ...prevState,
                                        pageNumber: 0,
                                        filters: {
                                            username: '',
                                        },
                                    }));
                                }}
                            >
                                <ClearIcon fontSize='small' />
                            </IconButton>
                        ),
                    }}
                    onChange={event => {
                        setFilters(prevState => ({
                            ...prevState,
                            username: event.target.value,
                        }));
                    }}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            setRowState(prevState => ({
                                ...prevState,
                                pageNumber: 0,
                                filters: {
                                    username: event.target.value,
                                },
                            }));
                        }
                    }}
                />
            ),
        },
        {
            field: 'emp_name',
            title: 'Emp Name',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'emp_rank',
            title: 'Emp Rank',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'class_name',
            title: 'Class Name',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'station_name',
            title: 'Station Name',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'emp_pass',
            title: 'Emp Pass',
            type: 'password',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'emp_bc',
            title: 'Emp BC',
            type: 'password',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'emp_pwd_pass',
            title: 'Emp PWD BC',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'email',
            title: 'Email',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'dept_name',
            title: 'Dept Name',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'owner',
            title: 'Owner',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
        {
            field: 'quit_date',
            title: 'Quit Date',
            type: 'datetime',
            headerStyle: {
                whiteSpace: 'nowrap',
            },
            cellStyle: {
                whiteSpace: 'nowrap',
            },
        },
    ];

    const actions = [
        {
            title: 'Edit',
            toolTip: 'Edit',
            disabled: !(canEdit || isAdministrator),
            visible: canEdit || isAdministrator,
            icon: () => <EditIcon color='primary' fontSize='small' />,
            onClick: async (event, rowData) => {
                showLoading(true);
                try {
                    const response = await axios.get(`/api/users/get-user-by-username/${rowData.emp_no}`);
                    const data = response.data;
                    setSelectedItem(data);
                    setOpen(true);
                } catch (err) {
                    const { message } = getErrorMessage(err);
                    enqueueSnackbar(message, {
                        variant: 'error',
                    });
                } finally {
                    showLoading(false);
                }
            },
        },
        {
            title: 'Delete',
            toolTip: 'Delete',
            disabled: !(canDelete || isAdministrator),
            visible: canDelete || isAdministrator,
            icon: () => <DeleteIcon color='secondary' fontSize='small' />,
            onClick: async (event, rowData) => {
                if (!window.confirm('Are you sure you want to delete this user?')) {
                    return;
                }

                showLoading(true);
                try {
                    await axios.delete(`/api/users/${rowData.emp_no}`);
                    fetchUsers(true);
                } catch (err) {
                    const { message } = getErrorMessage(err);
                    enqueueSnackbar(message, {
                        variant: 'error',
                    });
                } finally {
                    showLoading(false);
                }
            },
        },
    ];

    return (
        <div className={classes.root}>
            <Paper className={classes.paper}>
                <Toolbar className={classes.toolbar}>
                    <div className={classes.titleBlock}>
                        <Typography variant='h6' className={classes.pageTitle}>
                            User Manager
                        </Typography>
                        <Typography variant='body2' className={classes.pageSubtitle}>
                            Manage users, import templates, and keep account information organized in one place.
                        </Typography>
                    </div>

                    <div className={classes.toolbarActions}>
                        <Chip className={classes.summaryChip} label={`${rowState.totalCount} users`} size='small' />
                        <Tooltip title='Add user'>
                            <span>
                                <Button
                                    size='small'
                                    disabled={!(canAdd || isAdministrator)}
                                    onClick={() => setOpen(true)}
                                    variant='contained'
                                    color='primary'
                                    className={classes.actionButton}
                                    startIcon={<MdAdd />}
                                >
                                    Add
                                </Button>
                            </span>
                        </Tooltip>

                        <Tooltip title='Upload file'>
                            <span>
                                <Button
                                    size='small'
                                    disabled={!canUploadAny}
                                    onClick={() => setOpenDialogUpload(true)}
                                    variant='outlined'
                                    color='primary'
                                    className={classes.actionButton}
                                    startIcon={<MdUpload />}
                                >
                                    Upload
                                </Button>
                            </span>
                        </Tooltip>

                        <Tooltip title='Download sample file'>
                            <Button
                                size='small'
                                variant='outlined'
                                color='primary'
                                onClick={() => setOpenDialogDownload(true)}
                                className={classes.actionButton}
                                startIcon={<MdDownload />}
                            >
                                Sample
                            </Button>
                        </Tooltip>
                    </div>
                </Toolbar>

                <TableContainer className={classes.tableContainer}>
                    <Table size='small' stickyHeader>
                        <TableHead>
                            {renderHeader(columns, actions)}
                            {renderHeaderFilter(columns, actions)}
                        </TableHead>
                        <TableBody>{renderRow(columns, rowState.items, actions, classes, canShowPassword)}</TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    className={classes.pagination}
                    rowsPerPageOptions={[10, 15, 20, 25, 30, 50, 100]}
                    component='div'
                    count={rowState.totalCount}
                    rowsPerPage={rowState.pageSize}
                    page={rowState.pageNumber}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            <Dialog
                open={openDialogUpload}
                onClose={handleCloseDialogUpload}
                aria-labelledby='upload-dialog-title'
                maxWidth='xs'
                fullWidth
            >
                <DialogTitle id='upload-dialog-title'>Upload sample file</DialogTitle>
                <DialogContent>
                    <DialogContentText className={classes.dialogDescription}>
                        Choose which dataset you want to upload. Only permitted actions are enabled.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogUpload}>Close</Button>
                    <Button
                        color='primary'
                        variant='outlined'
                        size='small'
                        onClick={() => {
                            handleCloseDialogUpload();
                            setOpenImport(true);
                        }}
                        disabled={!(canImport || isAdministrator)}
                        startIcon={<MdUpload />}
                    >
                        Upload User
                    </Button>
                    <Button
                        color='primary'
                        variant='outlined'
                        size='small'
                        onClick={() => {
                            handleCloseDialogUpload();
                            setOpenImportOwner(true);
                        }}
                        disabled={!(canImportOwner || isAdministrator)}
                        startIcon={<MdUpload />}
                    >
                        Upload Owner
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openDialogDownload}
                onClose={handleCloseDialogDownload}
                aria-labelledby='download-dialog-title'
                maxWidth='xs'
                fullWidth
            >
                <DialogTitle id='download-dialog-title'>Download sample file</DialogTitle>
                <DialogContent>
                    <DialogContentText className={classes.dialogDescription}>
                        Download template files before preparing data for import.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogDownload}>Close</Button>
                    <Button
                        color='primary'
                        variant='outlined'
                        size='small'
                        href={`${process.env.PUBLIC_URL}/assets/samples/User_Sample.xlsx`}
                        startIcon={<MdDownload />}
                    >
                        User Sample
                    </Button>
                    <Button
                        color='primary'
                        variant='outlined'
                        size='small'
                        href={`${process.env.PUBLIC_URL}/assets/samples/Owner_Sample.xlsx`}
                        startIcon={<MdDownload />}
                    >
                        Owner Sample
                    </Button>
                </DialogActions>
            </Dialog>

            {open && (
                <Suspense
                    fallback={
                        <div className={classes.lazyFallback}>
                            <CircularProgress size={22} />
                        </div>
                    }
                >
                    <AddOrEditUserModal
                        selectedItem={selectedItem}
                        open={open}
                        onClose={() => {
                            setOpen(false);
                            setSelectedItem(null);
                            fetchUsers(true);
                        }}
                    />
                </Suspense>
            )}

            {openImport && (
                <Suspense
                    fallback={
                        <div className={classes.lazyFallback}>
                            <CircularProgress size={22} />
                        </div>
                    }
                >
                    <UploadFileModal
                        open={openImport}
                        title='Upload User'
                        onClose={() => {
                            setOpenImport(false);
                            fetchUsers(true);
                        }}
                        onStart={() => { }}
                        url='/api/users/import/user'
                        onFinished={() => {
                            enqueueSnackbar('Upload Successful', {
                                variant: 'success',
                            });
                        }}
                        onFailure={err => {
                            const { message } = getErrorMessage(err);
                            enqueueSnackbar(message, {
                                variant: 'error',
                            });
                        }}
                    />
                </Suspense>
            )}

            {openImportOwner && (
                <Suspense
                    fallback={
                        <div className={classes.lazyFallback}>
                            <CircularProgress size={22} />
                        </div>
                    }
                >
                    <UploadFileModal
                        open={openImportOwner}
                        title='Upload Owner'
                        onClose={() => {
                            setOpenImportOwner(false);
                            fetchUsers(true);
                        }}
                        onStart={() => { }}
                        url='/api/users/import/owner'
                        onFinished={() => {
                            enqueueSnackbar('Upload Successful', {
                                variant: 'success',
                            });
                        }}
                        onFailure={err => {
                            const { message } = getErrorMessage(err);
                            enqueueSnackbar(message, {
                                variant: 'error',
                            });
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default UserManager;

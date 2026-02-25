import React, { useCallback, useEffect, useState } from 'react';
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
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import Moment from 'react-moment';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import FilterListIcon from '@material-ui/icons/FilterList';
import debounce from 'debounce';
import AddOrEditUserModal from './components/AddOrEditUserModal';
import clsx from 'clsx';
import Button from '@material-ui/core/Button';
import ClearIcon from '@material-ui/icons/Clear';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import { pink } from '@material-ui/core/colors';
import useAuth from '../../hooks/useAuth';
import { hasPermission } from '../../auth/authRoles';
import UploadFileModal from '../../components/UploadFileModal';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import Box from '@material-ui/core/Box';
import { Icon } from '@material-ui/core';
import { MdDownload, MdUpload, MdAdd } from 'react-icons/md';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const useStyles = makeStyles(theme => ({
    root: {

    },
    toolbar: {
        display: 'flex',
        '& > *': {
            margin: 2
        }
    },
    table: {

    },
    headerRow: {

    },
    headerRowFilter: {

    },
    tableRow: {

    },
    actionStyle: {
        display: 'flex'
    },
    unConfirmTableRowStyle: {
        backgroundColor: pink[500],
        '& > *': {
            color: 'white',
        },
    },
}));
const StyledTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);
const StyledTableRow = withStyles((theme) => ({
    root: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
    },
}))(TableRow);
const renderAction = (row, actions) => {
    return <TableCell>
        <Box display='flex'>
            {actions.map((action, actionIndex) => {

                if (action.toolTip) {
                    return ((action.visible || action.visible === undefined) ? (
                        <Tooltip key={actionIndex} title={action.toolTip}>
                            <span>
                                <IconButton size='small' disabled={action.disabled} onClick={(event) => action.onClick && action.onClick(event, row)}>
                                    {action.icon && action.icon()}
                                </IconButton>
                            </span>
                        </Tooltip>
                    )
                        : null
                    )
                }
                return ((action.visible || action.visible === undefined) ? (
                    <IconButton size='small' key={actionIndex} disabled={action.disabled} onClick={(event) => action.onClick && action.onClick(event, row)}>
                        {action.icon && action.icon()}
                    </IconButton>)
                    : null)
            })}
        </Box>
    </TableCell>
};

const TableCellEx = ({ row, col, colIndex, }) => {

    const [showPassword, setShowPassword] = useState(false);

    const { user } = useAuth();

    const canShowPassword = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['SHOW_PASSWORD'],
        },
    });

    if (typeof col.render === 'function') {
        return (<TableCell key={colIndex} style={col.cellStyle}>
            {col.render(row)}
        </TableCell>
        );
    }
    if (row[col.field] && col.type === 'datetime') {


        return (
            <TableCell key={colIndex} style={col.cellStyle}>

                <Moment format='YYYY/MM/DD hh:mm:ss A'>
                    {row[col.field]}
                </Moment>
            </TableCell>
        );
    }
    if (row[col.field] && col.type === 'password') {

        return (
            <TableCell key={colIndex} style={col.cellStyle}>

                {showPassword ? row[col.field] : '**********'}
                <Tooltip title='Show Password'>
                    <span>
                        <IconButton size='small' disabled={canShowPassword ? false : true} onClick={() => {

                            setShowPassword(!showPassword);
                        }}>
                            {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                    </span>
                </Tooltip>
            </TableCell>
        );
    }
    return (
        <TableCell key={colIndex} style={col.cellStyle}>
            {row[col.field]}
        </TableCell>
    );
};

const TableRowEx = ({ columns, row, actions }) => {

    return <StyledTableRow>
        {renderAction(row, actions)}
        {columns.map((col, colIndex) => {
            return <TableCellEx row={row} col={col} key={colIndex} />
        })}
    </StyledTableRow>
};

const renderRow = (columns, rows, actions) => {
    return rows.map((row, rowIndex) => {

        return <TableRowEx key={rowIndex} columns={columns} row={row} actions={actions} />
    });
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



    const [filters, setFilters] = useState({
        username: ''
    });
    const [selectedItem, setSelectedItem] = useState(null);
    const [rowState, setRowState] = useState({
        pageNumber: parseInt(searchParams.get('pageNumber')) || 0,
        pageSize: parseInt(searchParams.get('pageSize')) || 15,
        totalCount: 0,
        items: [],
        filters: {
            username: searchParams.get('username') || '',
        },
    });

    const { user } = useAuth();

    const canAdd = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['ADD']
        },
    });
    const canEdit = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['EDIT']
        },
    });
    const canDelete = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ["DELETE"],
        },
    });

    const canImport = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['IMPORT']
        },
    });

    const canImportOwner = hasPermission({
        user,
        system_program: {
            name: 'USER_MANAGER',
            permissions: ['IMPORT_OWNER']
        },
    });

    const isAdministrator = hasPermission({
        user,
        roles: ['Administrator']
    });

    const handleClickOpenDialogDownload = () => {
        setOpenDialogDownload(true);
    };

    const handleCloseDialogDownload = (value) => {
        setOpenDialogDownload(false);
    };

    const handleClickOpenDialogUpload = () => {
        setOpenDialogUpload(true);
    };

    const handleCloseDialogUpload = (value) => {
        setOpenDialogUpload(false);
    };

    const fetchUsers = useCallback(async () => {
        showLoading(true);

        try {
            const response = await axios.get(`/api/users?pageSize=${rowState.pageSize}&pageNumber=${rowState.pageNumber}&username=${rowState.filters.username || ''}`)
            console.log(response);

            const data = response.data;
            setRowState(prevState => ({
                ...prevState,
                totalCount: data.totalCount,
                items: data.items,

            }));

            showLoading(false);

        } catch (err) {
            showLoading(false);
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error',
            });
        }
    }, [rowState.pageSize, rowState.pageNumber, rowState.filters]);



    const handleChangePage = (event, newPage) => {
        setRowState(prevState => ({
            ...prevState,
            pageNumber: newPage
        }));

    };

    const handleChangeRowsPerPage = (event) => {

        setRowState(prevState => ({
            ...prevState,
            pageNumber: 0,
            pageSize: +event.target.value
        }));
    };

    const renderHeaderActions = (columns, actions, title, isFilter = false) => {
        const isHasActions = actions && actions.length > 0;
        return isHasActions ?
            isFilter ? <TableCell>{title}</TableCell>
                :
                <StyledTableCell>{title}</StyledTableCell>
            :
            null
    };

    const renderHeader = (columns) => {
        return (<TableRow>
            {renderHeaderActions(columns, actions, 'Actions')}
            {
                columns.map((col, colIndex) => {
                    return (
                        <StyledTableCell key={colIndex} style={col.headerStyle}>
                            {col.title}
                        </StyledTableCell>
                    )
                })
            }
        </TableRow>
        );

    };


    const renderHeaderFilter = (columns, actions) => {
        const isNeedFiltered = columns.some(col => typeof col.filterComponent === 'function');
        //console.log(isNeedFiltered);

        return isNeedFiltered ?
            <TableRow className={classes.headerRowFilter}>
                {renderHeaderActions(columns, actions, '', true)}
                {columns.map((column, colIndex) => {
                    if (typeof column.filterComponent === 'function') {

                        return <TableCell key={colIndex}>

                            {column.filterComponent({ column })}
                        </TableCell>
                    } else {
                        return <TableCell key={colIndex}>

                        </TableCell>
                    }
                })}
            </TableRow>

            : null

    };

    const onFilterChangeDebounce = debounce(() => {

        setRowState(prevState => ({
            ...prevState,
            filters: {
                model_name: filters.model_name,
            },

        }));

    }, [300]);
    const onFilterChange = (event) => {

        onFilterChangeDebounce();
    };


    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    useEffect(() => {
        document.title = `User Manager`;
    }, []);
    const columns = [
        {
            field: 'emp_no',
            title: 'Emp No',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
            filterComponent: (options) => {
                //console.log(options);
                return (
                    <TextField

                        style={{
                            width: 180
                        }}

                        name='username'
                        //label='Mo Number'
                        //variant='standard'
                        value={filters.username}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <Tooltip title="Filter Username">
                                        <FilterListIcon />
                                    </Tooltip>
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <IconButton
                                    title='Clear'
                                    aria-label='Clear'
                                    size='small'
                                    style={{ visibility: filters.username ? 'visible' : 'hidden' }}
                                    onClick={(event) => {
                                        setFilters(prevState => ({
                                            ...prevState,
                                            username: ''
                                        }));
                                        setRowState(prevState => ({
                                            ...prevState,
                                            filters: {
                                                username: '',
                                            },
                                        }));
                                    }}
                                >
                                    <ClearIcon />
                                </IconButton>
                            )


                        }}
                        onChange={(event) => {
                            //console.log(event.target.value);
                            setFilters(prevState => ({
                                ...prevState,
                                username: event.target.value
                            }));
                            //onFilterChange();

                        }}

                        onKeyDown={(event) => {
                            //console.log(event.key);
                            if (event.key === 'Enter') {
                                setRowState(prevState => ({
                                    ...prevState,
                                    filters: {
                                        username: event.target.value,
                                    },

                                }));

                            }
                        }}
                    />
                );
            },
        },
        {
            field: 'emp_name',
            title: 'Emp Name',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'emp_rank',
            title: 'Emp Rank',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'class_name',
            title: 'Class Name',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'station_name',
            title: 'Station Name',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'emp_pass',
            title: 'Emp Pass',
            type: 'password',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'emp_bc',
            title: 'Emp BC',
            type: 'password',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'emp_pwd_pass',
            title: 'Emp PWD BC',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'email',
            title: 'Email',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'dept_name',
            title: 'Dept Name',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'owner',
            title: 'Owner',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },
        {
            field: 'quit_date',
            title: 'Quit Date',
            type: 'datetime',
            headerStyle: {
                whiteSpace: 'nowrap'
            },
            cellStyle: {
                whiteSpace: 'nowrap'
            },
        },

    ];

    const actions = [
        {
            title: 'Edit',
            toolTip: "Edit",
            disabled: (canEdit || isAdministrator) ? false : true,
            visible: (canEdit || isAdministrator) ? true : false,
            icon: () => <EditIcon />,
            onClick: async (event, rowData) => {
                //alert(JSON.stringify(rowData));
                showLoading(true);
                try {
                    const response = await axios.get(`/api/users/get-user-by-username/${rowData.emp_no}`);
                    const data = response.data;
                    console.log(data);
                    setSelectedItem(data);
                    setOpen(true);
                    showLoading(false);
                } catch (err) {
                    console.error(err);
                    showLoading(false);
                    const { message } = getErrorMessage(err);
                    enqueueSnackbar(message, {
                        variant: 'error'
                    });
                }

            },
        },
        {
            title: 'Delete',
            toolTip: "Delete",
            disabled: (canDelete || isAdministrator) ? false : true,
            visible: (canDelete || isAdministrator) ? true : false,
            icon: () => <DeleteIcon />,
            onClick: async (event, rowData) => {


                if (window.confirm('Are sure delete?')) {
                    showLoading(true);
                    try {
                        await axios.delete(`/api/users/${rowData.emp_no}`);

                        showLoading(false);
                        fetchUsers();
                    } catch (err) {
                        showLoading(false);
                        const { message } = getErrorMessage(err);
                        enqueueSnackbar(message, {
                            variant: 'error',
                        });
                    }
                }
            },
        }

    ];
    return (
        <>
            <Paper>
                <Toolbar className={classes.toolbar}>
                    <Tooltip title="Add">
                        <span>
                            <Button
                                size='small'
                                disabled={(canAdd || isAdministrator) ? false : true}
                                onClick={() => setOpen(true)}
                                variant='outlined'
                                color='primary'
                                startIcon={
                                    <MdAdd />
                                }>
                                Add
                            </Button>
                        </span>
                    </Tooltip>
                    {/* <Tooltip title="Upload">
                        <span>
                            <Button
                                size='small'
                                disabled={(canImport || isAdministrator) ? false : true}
                                onClick={() => setOpenImport(true)}
                                variant='outlined'
                                color='primary'
                                startIcon={
                                    <MdUpload />
                                }
                            >
                                Upload
                            </Button>
                        </span>
                    </Tooltip> */}
                    <Tooltip title="Upload">
                        <span>
                            <Button
                                size='small'
                                //disabled={(canImport || isAdministrator) ? false : true}
                                onClick={handleClickOpenDialogUpload}
                                variant='outlined'
                                color='primary'
                                startIcon={
                                    <MdUpload />
                                }
                            >
                                Upload
                            </Button>
                        </span>
                    </Tooltip>
                    <Dialog
                        open={openDialogUpload}
                        onClose={() => handleCloseDialogUpload(null)} // Xử lý khi click ra ngoài hoặc nhấn Esc
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">
                            {"Upload sample file"}
                        </DialogTitle>
                        <DialogActions>
                            <Button
                                color='primary'
                                variant='outlined'
                                size='small'
                                onClick={() => setOpenImport(true)}
                                disabled={(canImport || isAdministrator) ? false : true}
                                startIcon={<MdUpload />}
                            >
                                Upload User
                            </Button>
                            <Button
                                color='primary'
                                variant='outlined'
                                size='small'
                                onClick={() => setOpenImportOwner(true)}
                                disabled={(canImportOwner || isAdministrator) ? false : true}
                                startIcon={<MdUpload />}
                            >
                                Upload Owner
                            </Button>
                        </DialogActions>
                    </Dialog>
                    {/* <Tooltip title="Download Sample File">
                        <Button
                            size='small'
                            variant='outlined'
                            color='primary'
                            href={`${process.env.PUBLIC_URL}/assets/samples/User_Sample.xlsx`}
                            startIcon={
                                        <MdDownload />
                            }
                        >
                            Download Sample File
                        </Button>
                    </Tooltip> */}
                    <Tooltip title="Download Sample File">
                        <Button
                            size='small'
                            variant='outlined'
                            color='primary'
                            onClick={handleClickOpenDialogDownload}
                            startIcon={
                                <MdDownload />
                            }
                        >
                            Download Sample File
                        </Button>
                    </Tooltip>
                    <Dialog
                        open={openDialogDownload}
                        onClose={() => handleCloseDialogDownload(null)} // Xử lý khi click ra ngoài hoặc nhấn Esc
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">
                            {"Download sample file"}
                        </DialogTitle>
                        <DialogActions>
                            <Button color='primary' variant='outlined' size='small' href={`${process.env.PUBLIC_URL}/assets/samples/User_Sample.xlsx`} startIcon={<MdDownload />}>User Sample</Button>
                            <Button color='primary' variant='outlined' size='small' href={`${process.env.PUBLIC_URL}/assets/samples/Owner_Sample.xlsx`} startIcon={<MdDownload />} >Owner Sample</Button>
                        </DialogActions>
                    </Dialog>


                </Toolbar>
                <TableContainer>
                    <Table size='small'>
                        <TableHead>

                            {renderHeader(columns, actions)}
                            {renderHeaderFilter(columns, actions)}
                        </TableHead>
                        <TableBody>
                            {renderRow(columns, rowState.items, actions)}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 15, 20, 25, 30, 50, 100]}
                    component="div"
                    count={rowState.totalCount}
                    rowsPerPage={rowState.pageSize}
                    page={rowState.pageNumber}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}

                />
            </Paper>
            {open && <AddOrEditUserModal selectedItem={selectedItem} open={open} onClose={() => {

                setOpen(false);
                setSelectedItem(null);
                fetchUsers();
            }} />}
            {openImport && <UploadFileModal
                open={openImport}
                title="Upload User"

                onClose={() => {
                    setOpenImport(false);
                    fetchUsers();
                }}
                onStart={() => {

                }}
                url={`/api/users/import/user`}
                onFinished={() => {
                    console.log('onFinished');
                    enqueueSnackbar('Upload Successful', {
                        variant: 'success',
                    });

                }} onFailure={(err) => {
                    console.log('onFailure');

                    console.log(err);
                    const { message } = getErrorMessage(err);
                    enqueueSnackbar(message, {
                        variant: 'error',
                    });
                }} />}
            {openImportOwner && <UploadFileModal
                open={openImportOwner}
                title="Upload Owner"

                onClose={() => {
                    setOpenImportOwner(false);
                    fetchUsers();
                }}
                onStart={() => {

                }}
                url={`/api/users/import/owner`}
                onFinished={() => {
                    console.log('onFinished');
                    enqueueSnackbar('Upload Successful', {
                        variant: 'success',
                    });

                }} onFailure={(err) => {
                    console.log('onFailure');

                    console.log(err);
                    const { message } = getErrorMessage(err);
                    enqueueSnackbar(message, {
                        variant: 'error',
                    });
                }} />}

        </>
    );
};

export default UserManager;

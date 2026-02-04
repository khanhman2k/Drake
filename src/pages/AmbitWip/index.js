import React, { useEffect, useState, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import axios from 'axios';
import Autocomplete from '@material-ui/lab/Autocomplete';
//import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import { getErrorMessage } from '../../utils/errorHandler';
import { useSnackbar } from 'notistack';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import RefreshIcon from '@material-ui/icons/Refresh';
import Paper from '@material-ui/core/Paper';
import WipDataGrid from './components/WipDataGrid';
import Skeleton from '@material-ui/lab/Skeleton';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { Grid, MenuItem, Menu, ListItemText, Stack } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MultipleSelectedListModal from '../../components/MultipleSelectedListModal';
import SettingsIcon from '@mui/icons-material/Settings';
const useStyles = makeStyles(theme => ({
    input: {
        marginRight: 5,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 80,
    },
    wipGridContainer: {
        minHeight: 'calc(100vh - 300px)',
        maxHeight: 'calc(100vh - 300px)',
        height: '100%',
        backgroundColor: 'rgb(227 227 227)'
        //overflow: 'scroll',

    }
}));
const AmbitWip = () => {
    const classes = useStyles();
    const { enqueueSnackbar } = useSnackbar();
    const [moTypes, setMoTypes] = useState(['ALL']);
    const [products, setProducts] = useState(['ALL']);
    const [sections, setSections] = useState(['ALL']);
    const [mos, setMos] = useState(['ALL']);
    const [lines, setLines] = useState([]);
    const [anchorSetting, setAnchorSetting] = useState(null);
    const openSetting = Boolean(anchorSetting);
    const handleOpenSetting = (event) => {
        setAnchorSetting(event.currentTarget);
    };

    const handleCloseSetting = () => {
        setAnchorSetting(null);
    };
    const [rowState, setRowState] = useState({
        columns: [],
        rows: [],
        summaries: [],
        isLoading: false,
    });


    const [filters, setFilters] = useState({
        mo_type: 'ALL',
        model_name: 'ALL',
        mo_number: 'ALL',
        section_name: 'ALL',
        isShowLine: true,
        isShowTransferQty: false,
        lines: [],
        status: '0',
    });

    const [lineListModal, setLineListModal] = useState(false);
    const fetchMoTypes = async () => {

        try {

            const response = await axios.get(`/api/pms/motype-distinct`);
            const data = response.data;
            console.log(data);
            setMoTypes(prevState => {
                return [...prevState, ...data];
            });
        } catch (err) {

            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error'
            });
        }
    };
    const fetchProducts = async () => {

        try {

            const response = await axios.get(`/api/products/distinct`);
            const data = response.data;
            console.log(data);
            setProducts(prevState => {
                return [...prevState, ...data];
            });
        } catch (err) {

            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error'
            });
        }
    };
    const fetchMos = useCallback(async () => {
        //showLoading(true);
        try {

            const response = await axios.get(`/api/pms/mo-online-by-model-name-distinct/${filters.model_name}`);
            const data = response.data;
            console.log(data);
            setMos(prevState => {
                return ['ALL', ...data];
            });

            //showLoading(false);
        } catch (err) {
            //showLoading(false);
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error'
            });
        }
    }, [filters.model_name]);
    const fetchLines = async () => {
        //showLoading(true);
        try {

            const response = await axios.get(`/api/lines/distinct`);
            const data = response.data;
            console.log(data);
            setLines(data);

            //showLoading(false);
        } catch (err) {
            //showLoading(false);
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error'
            });
        }
    };
    const fetchSections = async () => {
        //showLoading(true);
        try {

            const response = await axios.get(`/api/sections/distinct`);
            const data = response.data;
            console.log(data);
            setSections(prevState => {
                return [...prevState, ...data];
            });

            //showLoading(false);
        } catch (err) {
            //showLoading(false);
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error'
            });
        }
    };
    const handleQuery = async (event) => {
        if (filters.model_name === 'ALL' && filters.mo_number === 'ALL') {
            alert(`Model Name and MO cannot choose at same time!`);
            return;
        }
        const params = {
            mo_type: filters.mo_type,
            model_name: filters.model_name,
            mo_number: filters.mo_number,
            section_name: filters.section_name,
            lines: filters.lines,
            isShowLine: filters.isShowLine,
            status: filters.status,

        };

        setRowState(prevState => ({
            ...prevState,
            isLoading: true,
        }));
        try {
            const rowResponse = await axios.post(`/api/ambitwip/query-mos`, params);
            const rows = rowResponse.data;
            console.log(rows);
            if (rows.length === 0) {
                enqueueSnackbar('No WIP found', {
                    variant: 'warning',
                });
                setRowState(prevState => ({
                    ...prevState,
                    isLoading: false,
                    rows: [],
                    columns: [],
                    summaries: []
                }));
                return;
            }
            const columnsResponse = await axios.post(`/api/ambitwip/query-wips`, params);
            const columns = columnsResponse.data;
            if (columns.length === 0) {
                enqueueSnackbar('No WIP found', {
                    variant: 'warning',
                });
                setRowState(prevState => ({
                    ...prevState,
                    isLoading: false,
                    rows: [],
                    columns: [],
                    summaries: []
                }));
                return;
            }
            console.log(columns);
            const mos = rows.map(row => {
                return row['mo_number'];
            });
            const distinctMos = mos.filter((x, y) => mos.indexOf(x) === y);
            console.log(distinctMos);
            //Query MO not input qty
            const moNotInputResponse = await axios.post(`/api/ambitwip/query-mo-notinput-qty`, {
                mos: distinctMos,
                isShowLine: filters.isShowLine,
            });
            const moNotinputs = moNotInputResponse.data;
            console.log(moNotinputs);

            //Query transfer MO qty
            let moTransferMos = null;
            if (filters.isShowTransferQty) {
                const moTransferMoResponse = await axios.post(`/api/ambitwip/query-transfer-mo-qty`, {
                    mos: distinctMos,
                    isShowLine: filters.isShowLine,
                });
                moTransferMos = moTransferMoResponse.data;
                console.log(moTransferMos);
            }
            //Query MO link qty
            const moLinkResponse = await axios.post(`/api/ambitwip/query-mo-link-qty`, {
                mos: distinctMos,
                isShowLine: filters.isShowLine,
            });
            const moLinks = moLinkResponse.data;
            console.log(moLinks);

            //Query MO Not Link qty
            const moNotLinkResponse = await axios.post(`/api/ambitwip/query-mo-notlink-qty`, {
                mos: distinctMos,
                isShowLine: filters.isShowLine,
            });
            const moNotLinks = moNotLinkResponse.data;
            console.log(moNotLinks);

            const colsMap = columns.map(col => {
                return {
                    ...col,
                    count: 0
                };
            });
            const rowsMap = rows.map(row => {
                let transfer_mo_qty = 0;
                if (filters.isShowTransferQty) {
                    const moTransferMo = moTransferMos.find(m => m.mo_number === row.mo_number);
                    if (moTransferMo) {
                        transfer_mo_qty = moTransferMo.transfer_mo_qty;
                    }
                }
                let notinput_qty = 0;
                const moNotInput = moNotinputs.find(m => m.mo_number === row.mo_number);
                if (moNotInput) {
                    notinput_qty = moNotInput.notinput_qty;
                }
                let link_qty = 0;
                const moLink = moLinks.find(m => m.mo_number === row.mo_number);
                if (moLink) {
                    link_qty = moLink.link_qty;
                }
                let notlink_qty = 0;
                const moNotLink = moNotLinks.find(m => m.mo_number === row.mo_number);
                if (moNotLink) {
                    notlink_qty = moNotLink.notlink_qty;
                }
                return {
                    ...row,
                    wips: colsMap,
                    ...(filters.isShowTransferQty && {
                        transfer_mo_qty: transfer_mo_qty,
                    }),
                    notinput_qty: notinput_qty,
                    link_qty: link_qty,
                    notlink_qty: notlink_qty,
                };
            });





            const response = await axios.post(`/api/ambitwip/query-wips-by-mos`, {
                mos: distinctMos,
                lines: filters.lines,
                isShowLine: filters.isShowLine,
            });

            let wips = [];
            wips = response.data;
            //console.log(wips);
            let newRows = rowsMap.map(row => {
                //console.log(row);


                const newWips = row.wips.map(wipItem => {

                    const wip = wips.find(w => {

                        const where = filters.isShowLine
                            ? w.mo_number === row.mo_number && w.line_name === row.line_name && w.wip_group === wipItem.wip_group
                            : w.mo_number === row.mo_number && w.wip_group === wipItem.wip_group;
                        return where;
                    });
                    //console.log(wip);
                    if (wip) {
                        return {
                            ...wipItem,
                            count: wip.count,
                        }
                    }
                    return {
                        ...wipItem
                    };
                });
                return {
                    ...row,
                    wips: newWips
                };
            });



            newRows = newRows.map((row => {
                let total = row.wips.reduce((accumulator, w) => {
                    //console.log(accumulator);
                    //console.log(w);
                    return accumulator + w.count;
                }, 0);
                return {
                    ...row,
                    total: total
                };
            }));

            console.log(newRows);

            const fixedColums = [
                {
                    field: 'mo_number',
                    title: 'Mo Number',
                    index: 0,
                    fixed: true,
                },
                {
                    field: 'model_name',
                    title: 'Model Name',
                    index: 1,
                    fixed: true,
                },
                {
                    field: 'target_qty',
                    title: 'Target Qty',
                    index: 3,
                    fixed: true,
                },
                {
                    field: 'device_config',
                    title: 'Device Config',
                    index: 4,
                    fixed: true,
                },
            ];
            const lineColObj = {
                field: 'line_name',
                title: 'Line Name',
                index: 2,
                fixed: true,
            };
            if (filters.isShowLine) {
                fixedColums.push(lineColObj);
            }
            console.log('Fixed Column');
            console.log(fixedColums);

            const wipStartIndex = 5;

            let allWipColumns = [];
            allWipColumns = newRows.length > 0 && newRows[0].wips.sort((a, b) => {
                return a.step_sequence - b.step_sequence;
            }).map((row, index) => {
                const wipGroupName = row['wip_group'];
                return {
                    field: wipGroupName,
                    title: wipGroupName,
                    index: wipStartIndex + index,
                    isWip: true,
                };
            });

            console.log('All Columns');
            console.log(allWipColumns);

            const trailingStartIndex = wipStartIndex + (allWipColumns?.length || 0);
            const trailingColumns = [
                {
                    field: 'total',
                    title: 'Total',
                    index: trailingStartIndex + 0,
                    summary: (rows) => {
                        return rows.reduce((accumulator, r) => {
                            return accumulator + r.total;
                        }, 0);
                    },
                },
                ...(filters.isShowTransferQty
                    ? [{
                        field: 'transfer_mo_qty',
                        title: 'Transfer MO Qty',
                        index: trailingStartIndex + 1,
                    }]
                    : []),
                {
                    field: 'notinput_qty',
                    title: 'Not Input Qty',
                    index: trailingStartIndex + 2,
                },
                {
                    field: 'link_qty',
                    title: 'Link Qty',
                    index: trailingStartIndex + 3,
                },
                {
                    field: 'notlink_qty',
                    title: 'Not Link Qty',
                    index: trailingStartIndex + 4,
                },
            ];

            const newColumns = [
                ...fixedColums,
                ...(allWipColumns || []),
                ...trailingColumns,
            ];

            const summaries = columns.map(wip => {
                let total = 0;
                newRows.forEach(element => {
                    const wipCount = element.wips.find(w => w.wip_group === wip.wip_group);
                    if (wipCount) {
                        total += wipCount.count;
                    }
                });


                return {
                    ...wip,
                    total: total,
                };
            });


            setRowState(prevState => ({
                ...prevState,
                isLoading: false,
                rows: newRows,
                columns: newColumns,
                summaries: summaries,
            }));

            //setRowMatrix(rowsMap);
        } catch (err) {
            console.error(err);
            setRowState(prevState => ({
                ...prevState,
                isLoading: false,
            }));
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error'
            });
        }
    };
    useEffect(() => {
        fetchMos();
    }, [fetchMos]);

    useEffect(() => {
        fetchMoTypes();
        fetchProducts();
        fetchLines();
        fetchSections();
        document.title = `Ambit Wip`;

    }, []);


    return (
        <>
            <Paper style={{
                marginBottom: 2
            }}>
                <Toolbar style={{
                    padding: 15,
                    backgroundColor: 'rgb(243 242 242)'
                }}>
                    <Grid container spacing={1}>
                        <Grid item xs={12} container spacing={1}>


                            <Grid item>
                                <Autocomplete

                                    size='small'
                                    className={classes.input}
                                    fullWidth
                                    getOptionLabel={(label) => label || ''}
                                    value={filters.mo_type}
                                    options={moTypes}
                                    style={{ width: 200 }}
                                    onChange={(event, newValue) => {
                                        console.log(newValue);
                                        if (newValue) {
                                            setFilters(prevState => ({
                                                ...prevState,
                                                mo_type: newValue,
                                            }));
                                        } else {
                                            setFilters(prevState => ({
                                                ...prevState,
                                                mo_type: 'ALL',
                                            }));
                                        }
                                    }}

                                    renderInput={params => (
                                        <TextField
                                            name='mo_type'
                                            label='Mo Type'
                                            variant='outlined'
                                            margin='dense'
                                            {...params}
                                        />
                                    )}
                                />
                            </Grid>



                            <Grid item>
                                <Autocomplete

                                    size='small'

                                    fullWidth
                                    getOptionLabel={(label) => label}
                                    value={filters.model_name}
                                    options={products}
                                    style={{ width: 240 }}
                                    onChange={(event, newValue) => {
                                        console.log(newValue);
                                        if (newValue) {
                                            setFilters(prevState => ({
                                                ...prevState,
                                                model_name: newValue,
                                            }));
                                        } else {
                                            setFilters(prevState => ({
                                                ...prevState,
                                                model_name: 'ALL',
                                            }));
                                        }
                                    }}

                                    renderInput={params => (
                                        <TextField
                                            name='model_name'
                                            label='Model Name'
                                            variant='outlined'
                                            margin='dense'
                                            {...params}
                                        />
                                    )}
                                />
                            </Grid>



                            <Grid item>
                                <Autocomplete

                                    size='small'

                                    className={classes.input}
                                    getOptionLabel={(label) => label}
                                    value={filters.mo_number}
                                    options={mos}
                                    style={{ width: 240 }}
                                    onChange={(event, newValue) => {
                                        console.log(newValue);
                                        if (newValue) {
                                            setFilters(prevState => ({
                                                ...prevState,
                                                mo_number: newValue,
                                            }));
                                        } else {
                                            setFilters(prevState => ({
                                                ...prevState,
                                                mo_number: 'ALL',
                                            }));
                                        }
                                    }}

                                    renderInput={params => (
                                        <TextField
                                            name='mo_number'
                                            label='Mo Number'
                                            variant='outlined'
                                            margin='dense'
                                            fullWidth
                                            {...params}
                                        />
                                    )}
                                />
                            </Grid>


                            <Grid item>
                                <Autocomplete

                                    size='small'

                                    getOptionLabel={(label) => label}
                                    value={filters.section_name}
                                    options={sections}
                                    style={{ width: 200 }}
                                    onChange={(event, newValue) => {
                                        console.log(newValue);
                                        if (newValue) {
                                            setFilters(prevState => ({
                                                ...prevState,
                                                section_name: newValue,
                                            }));
                                        } else {
                                            setFilters(prevState => ({
                                                ...prevState,
                                                section_name: 'ALL',
                                            }));
                                        }
                                    }}

                                    renderInput={params => (
                                        <TextField
                                            name='section_name'
                                            label='Section Name'
                                            variant='outlined'
                                            fullWidth
                                            margin='dense'
                                            {...params}
                                        />
                                    )}
                                />

                            </Grid>
                            <Grid item>
                                <Grid item container spacing={0} justifyContent='center' alignItems='center'>
                                    <Grid item>
                                        <IconButton
                                            variant='outlined'
                                            color='primary'
                                            size='small'
                                            onClick={() => {
                                                setLineListModal(true);
                                            }}
                                        >
                                            <MenuIcon />
                                        </IconButton>

                                    </Grid>
                                    <Grid item>
                                        <Autocomplete

                                            size='small'
                                            className={classes.input}
                                            limitTags={1}
                                            style={{ width: 240 }}
                                            disableListWrap
                                            getOptionLabel={(label) => label}
                                            value={filters.lines}
                                            options={lines}
                                            multiple
                                            onChange={(event, newValue) => {
                                                console.log(newValue);

                                                setFilters(prevState => ({
                                                    ...prevState,
                                                    lines: newValue,
                                                }));

                                            }}

                                            renderInput={params => (
                                                <TextField
                                                    name='lines'
                                                    label='Lines'
                                                    variant='outlined'
                                                    margin='dense'
                                                    {...params}
                                                    fullWidth
                                                />
                                            )}
                                        />

                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item>

                                <FormControl className={classes.formControl}>
                                    <InputLabel id="status">MO Status</InputLabel>
                                    <Select

                                        value={filters.status}

                                        onChange={(event) => {

                                            setFilters(prevState => ({
                                                ...prevState,
                                                status: event.target.value,
                                            }));

                                        }}
                                    >
                                        {[
                                            {
                                                title: 'All',
                                                value: '0'
                                            },
                                            {
                                                title: 'Online',
                                                value: '2'
                                            },
                                            {
                                                title: 'Close',
                                                value: '3'
                                            },
                                        ].map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.title}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item>
                                {/* <FormControlLabel
                                    style={{
                                        marginLeft: 2
                                    }}
                                    control={
                                        <Checkbox
                                            size='small'
                                            checked={filters.isShowLine}
                                            onChange={(event) => {

                                                const { checked } = event.target;
                                                // console.log(checked);
                                                setFilters(prevState => ({
                                                    ...prevState,
                                                    isShowLine: checked
                                                }));


                                            }}
                                            inputProps={{ 'aria-label': 'Show Line' }}
                                            color='primary'

                                        />
                                    }
                                    label='Show Line'
                                /> */}
                                <Button
                                    size="small"
                                    startIcon={<SettingsIcon />}
                                    onClick={handleOpenSetting}
                                >
                                    Settings
                                </Button>
                                <Menu
                                    anchorEl={anchorSetting}
                                    open={openSetting}
                                    onClose={handleCloseSetting}
                                >
                                    <MenuItem disableRipple>
                                        <Checkbox
                                            size="small"
                                            checked={filters.isShowLine}
                                            onChange={(e) =>
                                                setFilters(prev => ({
                                                    ...prev,
                                                    isShowLine: e.target.checked
                                                }))
                                            }
                                        />
                                        <ListItemText primary="Show Line" />
                                    </MenuItem>

                                    <MenuItem disableRipple>
                                        <Checkbox
                                            size="small"
                                            checked={filters.isShowTransferQty}
                                            onChange={(e) =>
                                                setFilters(prev => ({
                                                    ...prev,
                                                    isShowTransferQty: e.target.checked
                                                }))
                                            }
                                        />
                                        <ListItemText primary="Show Transfer MO Qty" secondary="(Số lượng SN đã link chuyển MO khác)" />
                                    </MenuItem>
                                </Menu>

                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant='outlined'
                                color='secondary'
                                startIcon={
                                    <RefreshIcon />
                                }
                                onClick={handleQuery}
                            >
                                Query
                            </Button>
                        </Grid>
                    </Grid>
                </Toolbar>
            </Paper>


            <Paper>
                <div className={classes.wipGridContainer}>
                    {rowState.isLoading ?
                        (
                            <>
                                <Skeleton
                                    animation='wave'
                                    height='50px'
                                    width='100%'
                                    variant='text'
                                />
                                <Skeleton
                                    animation='wave'
                                    height='100px'
                                    width='100px'
                                    variant='circle'
                                />
                                <Skeleton
                                    animation='wave'
                                    height='200px'
                                    width='100%'
                                    variant='rect'
                                />
                            </>
                        )
                        :
                        <WipDataGrid
                            isShowLine={filters.isShowLine}
                            rows={rowState.rows}
                            columns={rowState.columns}
                            summaries={rowState.summaries}
                        />
                    }
                </div>

            </Paper>

            {
                lineListModal &&
                <MultipleSelectedListModal
                    open={lineListModal}
                    title={'Lines'}
                    options={lines}
                    value={filters.lines}
                    onClose={() => {
                        setLineListModal(false);
                    }}
                    onSuccess={(data) => {
                        setFilters(prevState => ({
                            ...prevState,
                            lines: data
                        }));
                        setLineListModal(false);
                    }}
                />
            }
        </>
    );
};

export default AmbitWip;

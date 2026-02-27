import React, { useEffect, useMemo, useState } from 'react';
import { useFormikContext } from 'formik';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import useLoading from '../../../hooks/useLoading';
import { getErrorMessage } from '../../../utils/errorHandler';
import { Autocomplete } from '@material-ui/lab';
import AddSystemProgramDialog from './Dialog/AddSystemProgramDialog';
import AddPermissionModal from './Dialog/AddPermissionModal';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    leftPanel: {
        borderRadius: 14,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        height: '100%',
        minHeight: 380,
        display: 'flex',
        flexDirection: 'column',
    },
    rightPanel: {
        borderRadius: 14,
        border: `1px solid ${theme.palette.divider}`,
        minHeight: 380,
        padding: theme.spacing(2),
        backgroundColor: '#fcfdff',
    },
    panelHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing(1.5, 2),
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: '#f7faff',
    },
    panelTitle: {
        fontWeight: 700,
        color: '#16305f',
    },
    panelSubTitle: {
        color: theme.palette.text.secondary,
        fontSize: 12,
        marginTop: theme.spacing(0.25),
    },
    addButton: {
        borderRadius: 10,
        textTransform: 'none',
        fontWeight: 600,
    },
    searchArea: {
        padding: theme.spacing(1.5, 2),
    },
    searchInput: {
        '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#fff',
        },
    },
    programList: {
        flex: 1,
        overflow: 'auto',
        padding: theme.spacing(0.5, 1.25, 1.25),
    },
    programItem: {
        borderRadius: 10,
        marginBottom: theme.spacing(0.5),
        border: `1px solid transparent`,
        '&.Mui-selected': {
            backgroundColor: '#eaf2ff',
            borderColor: '#cddfff',
        },
        '&.Mui-selected:hover': {
            backgroundColor: '#e4efff',
        },
    },
    removeButton: {
        color: theme.palette.error.main,
    },
    emptyListText: {
        textAlign: 'center',
        color: theme.palette.text.secondary,
        padding: theme.spacing(3, 1),
    },
    permissionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: theme.spacing(1.5),
        flexWrap: 'wrap',
        marginBottom: theme.spacing(2),
    },
    selectedProgramName: {
        fontWeight: 700,
        color: '#16305f',
    },
    selectedProgramHint: {
        marginTop: theme.spacing(0.5),
    },
    permissionActions: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        flexWrap: 'wrap',
    },
    filterLabel: {
        marginLeft: theme.spacing(0.5),
        marginRight: 0,
    },
    permissionAutocomplete: {
        '& .MuiOutlinedInput-root': {
            alignItems: 'flex-start',
            borderRadius: 10,
            backgroundColor: '#fff',
        },
    },
    permissionOption: {
        '&[aria-selected="true"]': {
            backgroundColor: '#e3f2fd',
        },
        '&[aria-selected="true"][data-focus="true"]': {
            backgroundColor: '#e3f2fd',
        },
    },
    tagChip: {
        backgroundColor: '#e3f2fd',
    },
    emptyRightPanel: {
        height: '100%',
        minHeight: 330,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: theme.palette.text.secondary,
        padding: theme.spacing(2),
    },
}));

const UserSystemProgramTab = () => {
    const { showLoading } = useLoading();
    const { enqueueSnackbar } = useSnackbar();
    const [permissions, setPermissions] = useState([]);
    const [filteredSP, setFilteredSP] = useState('');
    const [selectedSystemProgram, setSelectedSystemProgram] = useState(null);
    const [addPermission, setAddPermission] = useState(false);
    const [open, setOpen] = useState(false);
    const [isFilterPermission, setIsFilterPermission] = useState(false);
    const [selectedPermissionName, setSelectedPermissionName] = useState('');
    const { values, setFieldValue } = useFormikContext();
    const classes = useStyles();

    const getPermissionName = permission => {
        if (!permission) {
            return '';
        }
        if (typeof permission === 'string') {
            return permission;
        }
        if (typeof permission === 'object' && permission.name) {
            return permission.name;
        }
        return '';
    };

    const fetchPermissions = async filterName => {
        showLoading(true);
        try {
            const endpoint = filterName
                ? `/api/system-programs/permissions-filter?prg_name=${encodeURIComponent(filterName)}`
                : '/api/system-programs/permissions';
            const response = await axios.get(endpoint);
            const data = response.data || [];
            setPermissions(data);
        } catch (err) {
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error',
            });
        } finally {
            showLoading(false);
        }
    };

    const handleSelect = systemProgram => {
        setSelectedSystemProgram(systemProgram);
        const permissionName = systemProgram.name;
        setSelectedPermissionName(permissionName);
        if (isFilterPermission && permissionName) {
            fetchPermissions(permissionName);
        }
    };

    const handlePermissionChange = (event, nextPermissions) => {
        if (!selectedSystemProgram) {
            return;
        }

        const newSP = {
            ...selectedSystemProgram,
            permissions: nextPermissions,
        };
        setSelectedSystemProgram(newSP);

        const systemPrograms = values.systemPrograms.map(sp => {
            if (sp.name === selectedSystemProgram.name) {
                return newSP;
            }
            return sp;
        });
        setFieldValue('systemPrograms', systemPrograms);

        const permissionName = selectedSystemProgram.name;
        setSelectedPermissionName(permissionName);
        if (isFilterPermission && permissionName) {
            fetchPermissions(permissionName);
        }
    };

    const handleAddSPClose = () => {
        setOpen(false);
    };

    const onAddNewSP = newSP => {
        setOpen(false);
        const systemProgram = values.systemPrograms.find(sp => sp.name === newSP.name);
        const systemPrograms = systemProgram ? [...values.systemPrograms] : [...values.systemPrograms, newSP];
        setFieldValue('systemPrograms', systemPrograms);
    };

    const handleRemoveSP = async systemProgram => {
        if (!systemProgram) {
            return;
        }

        const systemPrograms = values.systemPrograms.filter(sp => sp.name !== systemProgram.name);
        await setFieldValue('systemPrograms', systemPrograms);

        if (selectedSystemProgram && selectedSystemProgram.name === systemProgram.name) {
            setSelectedSystemProgram(null);
            setSelectedPermissionName('');
        }
    };

    const handleFilterPermissionToggle = event => {
        const checked = event.target.checked;
        setIsFilterPermission(checked);

        if (!checked) {
            fetchPermissions();
            return;
        }

        const permissionName = selectedPermissionName;
        if (permissionName) {
            fetchPermissions(permissionName);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const filteredPrograms = useMemo(() => {
        if (!values.systemPrograms) {
            return [];
        }

        const keyword = filteredSP.trim().toLowerCase();
        if (!keyword) {
            return values.systemPrograms;
        }

        return values.systemPrograms.filter(sp => sp.name.toLowerCase().includes(keyword));
    }, [filteredSP, values.systemPrograms]);

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Paper className={classes.leftPanel}>
                        <Box className={classes.panelHeader}>
                            <Box>
                                <Typography variant='subtitle1' className={classes.panelTitle}>
                                    System Programs
                                </Typography>
                                <Typography className={classes.panelSubTitle}>
                                    Select a program to configure permissions
                                </Typography>
                            </Box>
                            <Button
                                size='small'
                                color='primary'
                                variant='outlined'
                                className={classes.addButton}
                                startIcon={<AddIcon />}
                                onClick={() => setOpen(true)}
                            >
                                Add
                            </Button>
                        </Box>

                        <Box className={classes.searchArea}>
                            <TextField
                                fullWidth
                                size='small'
                                variant='outlined'
                                className={classes.searchInput}
                                placeholder='Search system program'
                                value={filteredSP}
                                onChange={event => setFilteredSP(event.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position='start'>
                                            <SearchIcon fontSize='small' />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <List className={classes.programList}>
                            {filteredPrograms.map(sp => (
                                <ListItem
                                    key={sp.name}
                                    button
                                    className={classes.programItem}
                                    onClick={() => handleSelect(sp)}
                                    selected={selectedSystemProgram && selectedSystemProgram.name === sp.name}
                                >
                                    <ListItemText
                                        primary={sp.name}
                                        secondary={`${(sp.permissions || []).length} permission(s)`}
                                    />
                                    <IconButton
                                        edge='end'
                                        aria-label='delete'
                                        size='small'
                                        className={classes.removeButton}
                                        onClick={event => {
                                            event.stopPropagation();
                                            handleRemoveSP(sp);
                                        }}
                                    >
                                        <DeleteIcon fontSize='small' />
                                    </IconButton>
                                </ListItem>
                            ))}

                            {filteredPrograms.length === 0 && (
                                <Typography variant='body2' className={classes.emptyListText}>
                                    No system program found.
                                </Typography>
                            )}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper className={classes.rightPanel}>
                        {selectedSystemProgram ? (
                            <>
                                <Box className={classes.permissionHeader}>
                                    <Box>
                                        <Typography variant='subtitle1' className={classes.selectedProgramName}>
                                            {selectedSystemProgram.name}
                                        </Typography>
                                        <Chip
                                            className={classes.selectedProgramHint}
                                            size='small'
                                            label={`${(selectedSystemProgram.permissions || []).length} selected permission(s)`}
                                        />
                                    </Box>

                                    <Box className={classes.permissionActions}>
                                        <Button
                                            color='primary'
                                            variant='outlined'
                                            size='small'
                                            className={classes.addButton}
                                            startIcon={<AddIcon />}
                                            onClick={() => setAddPermission(true)}
                                        >
                                            Add Permission
                                        </Button>
                                        <FormControlLabel
                                            className={classes.filterLabel}
                                            control={
                                                <Checkbox
                                                    color='primary'
                                                    checked={isFilterPermission}
                                                    onChange={handleFilterPermissionToggle}
                                                />
                                            }
                                            label='Filter by selected program'
                                        />
                                    </Box>
                                </Box>

                                <Autocomplete
                                    className={classes.permissionAutocomplete}
                                    onChange={handlePermissionChange}
                                    getOptionLabel={option =>
                                        typeof option === 'string' ? option : option && option.name ? option.name : ''
                                    }
                                    multiple
                                    disableCloseOnSelect
                                    value={selectedSystemProgram.permissions || []}
                                    options={permissions}
                                    classes={{ option: classes.permissionOption }}
                                    renderOption={(option, { selected }) => (
                                        <Box
                                            component='span'
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                backgroundColor: selected ? '#e3f2fd' : 'inherit',
                                            }}
                                        >
                                            {getPermissionName(option)}
                                        </Box>
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                {...getTagProps({ index })}
                                                key={`${getPermissionName(option)}-${index}`}
                                                label={getPermissionName(option)}
                                                className={classes.tagChip}
                                            />
                                        ))
                                    }
                                    renderInput={params => <TextField {...params} label='Permissions' variant='outlined' />}
                                />
                            </>
                        ) : (
                            <Box className={classes.emptyRightPanel}>
                                <Typography variant='body2'>
                                    Select a system program from the left panel to configure permissions.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {open && <AddSystemProgramDialog open={open} onClose={handleAddSPClose} onAddNewSP={onAddNewSP} />}
            {addPermission && (
                <AddPermissionModal
                    title='Permission'
                    open={addPermission}
                    onClose={() => setAddPermission(false)}
                    onSuccess={() => {
                        fetchPermissions();
                    }}
                />
            )}
        </>
    );
};

export default UserSystemProgramTab;

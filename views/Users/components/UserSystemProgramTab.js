import React, { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { Box, Button, Checkbox, Chip, FormControlLabel, Grid, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';

import axios from 'axios';
import { useSnackbar } from 'notistack';
import useLoading from '../../../hooks/useLoading';
import { getErrorMessage } from '../../../utils/errorHandler';
import { Autocomplete } from '@material-ui/lab';
import AddSystemProgramDialog from './Dialog/AddSystemProgramDialog';
import AddPermissionModal from './Dialog/AddPermissionModal';
const useStyles = makeStyles(() => ({
    permissionOption: {
        '&[aria-selected="true"]': {
            backgroundColor: '#e3f2fd'
        },
        '&[aria-selected="true"][data-focus="true"]': {
            backgroundColor: '#e3f2fd'
        }
    }
}));
const UserSystemProgramTab = () => {
    //console.log('[UserSystemProgramTab');
    const classes = useStyles();
    const { showLoading } = useLoading();
    const { enqueueSnackbar } = useSnackbar();
    const [permissions, setPermissions] = useState([]);
    const [filteredSP, setFilteredSP] = useState('');
    const [selectedSystemProgram, setSelectedSystemProgram] = useState(null);
    const [addPermission, setAddPermission] = useState(false);
    const [open, setOpen] = useState(false);
    const [isFilterPermission, setIsFilterPermission] = useState(false);
    const [selectedPermissionName, setSelectedPermissionName] = useState('');
    const { values, errors, setFieldError, setFieldValue } = useFormikContext();
    const getPermissionName = (permission) => {
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

    const getLastSelectedPermissionName = (permissionList) => {
        if (!Array.isArray(permissionList) || permissionList.length === 0) {
            return '';
        }
        return getPermissionName(permissionList[permissionList.length - 1]);
    };

    const fetchPermissions = async (filterName) => {
        showLoading(true);
        try {
            const endpoint = filterName
                ? `/api/system-programs/permissions/permissions-filter?prg_name=${encodeURIComponent(filterName)}`
                : '/api/system-programs/permissions';
            const response = await axios.get(endpoint);
            console.log(response);
            const data = response.data;
            setPermissions(data);
            showLoading(false);
        } catch (err) {
            console.log(err);
            showLoading(false);
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error'
            });
        }

    };
    const handleSelect = (systemProgram) => {
        console.log(systemProgram);
        setSelectedSystemProgram(systemProgram);
        const permissionName = getLastSelectedPermissionName(systemProgram && systemProgram.permissions);
        setSelectedPermissionName(permissionName);
        if (isFilterPermission && permissionName) {
            fetchPermissions(permissionName);
        }
    };
    const handlePermissionChange = (event, nextPermissions) => {
        console.log(nextPermissions);
        const newSP = {
            ...selectedSystemProgram,
            permissions: nextPermissions
        };
        setSelectedSystemProgram(newSP);
        let systemPrograms = [];

        systemPrograms = values.systemPrograms.map(sp => {
            if (sp.name === selectedSystemProgram.name) {

                return newSP;

            }
            return sp;


        });
        //console.log(systemPrograms);
        setFieldValue('systemPrograms', systemPrograms);
        const permissionName = getLastSelectedPermissionName(nextPermissions);
        setSelectedPermissionName(permissionName);
        if (isFilterPermission && permissionName) {
            fetchPermissions(permissionName);
        }
    };

    const handleAddSPClose = () => {
        setOpen(false);
    };
    const onAddNewSP = (newSP) => {
        // console.log(newSP);
        setOpen(false);
        // console.log(newSP);
        let systemPrograms = [];
        const systemProgram = values.systemPrograms.find(sp => sp.name === newSP.name);

        //  console.log(systemProgram);
        if (systemProgram) {
            systemPrograms = [...values.systemPrograms];
        } else {
            systemPrograms = [...values.systemPrograms, newSP];
        }

        setFieldValue('systemPrograms', systemPrograms);
    };
    const handleRemoveSP = async (sp) => {
        if (!selectedSystemProgram) {
            return;
        }

        let systemPrograms = [];
        const systemProgram = values.systemPrograms.find(sp => sp.name === selectedSystemProgram.name);
        if (systemProgram) {
            systemPrograms = [...values.systemPrograms.filter(sp => sp.name !== selectedSystemProgram.name)];
        } else {
            systemPrograms = [...values.systemPrograms];
        }
        await setFieldValue('systemPrograms', systemPrograms);
        setSelectedSystemProgram(null);
        setSelectedPermissionName('');
    };
    const handleFilterPermissionToggle = (event) => {
        const checked = event.target.checked;
        setIsFilterPermission(checked);
        if (!checked) {
            fetchPermissions();
            return;
        }
        const permissionName = selectedPermissionName || getLastSelectedPermissionName(selectedSystemProgram && selectedSystemProgram.permissions);
        if (permissionName) {
            fetchPermissions(permissionName);
        }
    };
    useEffect(() => {
        fetchPermissions();
    }, []);
    return (
        <>
            <Grid container>
                <Grid item sm={4}>
                    <Grid container>
                        <Grid item>
                            <TextField
                                name=''
                                label='Search'
                                onChange={(event) => setFilteredSP(event.target.value)}
                            />
                        </Grid>
                        <Grid item>
                            <IconButton onClick={() => { setOpen(true) }} color='primary'>
                                <AddIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                    <List component="nav">
                        {values.systemPrograms && values.systemPrograms.filter(sp => {
                            if (!filteredSP) {
                                return sp;
                            }
                            return sp.name.toLowerCase().indexOf(filteredSP.toLowerCase()) > -1;
                        }).map((sp, index) => {
                            return (
                                <ListItem key={index} button onClick={() => handleSelect(sp)} selected={selectedSystemProgram && selectedSystemProgram.name === sp.name}>

                                    <ListItemText primary={sp.name} />
                                    <ListItemSecondaryAction onClick={() => handleRemoveSP(sp)}>
                                        <IconButton edge="end" aria-label='delete' color='secondary'>
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>);
                        })}
                    </List>
                </Grid>
                <Grid item sm={8}>

                    {selectedSystemProgram && (
                        <>
                            <Box display="flex" alignItems="center">
                                <IconButton
                                    color='primary'
                                    onClick={(event) => {

                                        setAddPermission(true);
                                    }}
                                >
                                    <AddIcon />
                                </IconButton>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            color="primary"
                                            checked={isFilterPermission}
                                            onChange={handleFilterPermissionToggle}
                                        />
                                    }
                                    label="Filter"
                                />
                            </Box>
                            <Autocomplete
                                onChange={handlePermissionChange}
                                getOptionLabel={(option) => (typeof option === 'string' ? option : option && option.name ? option.name : '')}
                                multiple
                                value={selectedSystemProgram.permissions}
                                options={permissions}
                                classes={{ option: classes.permissionOption }}
                                renderTags={(value, getTagProps) => value.map((option, index) => (
                                    <Chip
                                        {...getTagProps({ index })}
                                        label={getPermissionName(option)}
                                        style={{ backgroundColor: '#e3f2fd' }}
                                    />
                                ))}
                                renderInput={(params) => <TextField {...params} label="Permissions" />}
                            />

                        </>
                    )
                    }


                </Grid>
            </Grid>
            {open && <AddSystemProgramDialog open={open} onClose={handleAddSPClose} onAddNewSP={onAddNewSP} />}
            {addPermission && <AddPermissionModal
                title={'Permission'}
                open={addPermission}
                onClose={() => setAddPermission(false)}
                onSuccess={() => {
                    fetchPermissions();
                }}
            />}
        </>
    );
};

export default UserSystemProgramTab;

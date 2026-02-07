import React, { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { Box, Button, Grid, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, TextField } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';

import axios from 'axios';
import { useSnackbar } from 'notistack';
import useLoading from '../../../hooks/useLoading';
import { getErrorMessage } from '../../../utils/errorHandler';
import { Autocomplete } from '@material-ui/lab';
import AddSystemProgramDialog from './Dialog/AddSystemProgramDialog';
import AddPermissionModal from './Dialog/AddPermissionModal';
const UserSystemProgramTab = () => {
    //console.log('[UserSystemProgramTab');
    const { showLoading } = useLoading();
    const { enqueueSnackbar } = useSnackbar();
    const [permissions, setPermissions] = useState([]);
    const [filteredSP, setFilteredSP] = useState('');
    const [selectedSystemProgram, setSelectedSystemProgram] = useState(null);
    const [addPermission, setAddPermission] = useState(false);
    const [open, setOpen] = useState(false);
    const { values, errors, setFieldError, setFieldValue } = useFormikContext();
    const fetchPermissions = async () => {
        showLoading(true);
        try {
            const response = await axios.get('/api/system-programs/permissions');
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
    };
    const handlePermissionChange = (event, permissions) => {
        console.log(permissions);
        const newSP = {
            ...selectedSystemProgram,
            permissions: permissions
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
                            <IconButton
                                color='primary'
                                onClick={(event) => {

                                    setAddPermission(true);
                                }}
                            >
                                <AddIcon />
                            </IconButton>
                            <Autocomplete
                                onChange={handlePermissionChange}
                                getOptionLabel={(option) => option}
                                multiple
                                value={selectedSystemProgram.permissions}
                                options={permissions}
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

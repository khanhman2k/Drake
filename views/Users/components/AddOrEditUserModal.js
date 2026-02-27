import React, { useEffect, useMemo, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Tab from '@material-ui/core/Tab';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import TabContext from '@material-ui/lab/TabContext';
import TabList from '@material-ui/lab/TabList';
import TabPanel from '@material-ui/lab/TabPanel';
import SaveIcon from '@material-ui/icons/Save';
import CloseIcon from '@material-ui/icons/Close';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import UserFormTab from './UserFormTab';
import UserRoleTab from './UserRoleTab';
import UserSystemProgramTab from './UserSystemProgramTab';
import UserStationTab from './UserStationTab';
import { useSnackbar } from 'notistack';
import useLoading from '../../../hooks/useLoading';
import { getErrorMessage } from '../../../utils/errorHandler';
import useAlertDialog from '../../../hooks/useAlertDialog';
import axios from 'axios';
import { hasPermission } from '../../../auth/authRoles';
import useAuth from '../../../hooks/useAuth';

const useStyles = makeStyles(theme => ({
    dialogPaper: {
        minHeight: '70vh',
        borderRadius: 16,
        overflow: 'hidden',
    },
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        padding: theme.spacing(2, 2.5),
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: 'linear-gradient(180deg, #f9fbff 0%, #f4f8ff 100%)',
    },
    headerInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.25),
    },
    title: {
        fontWeight: 700,
        color: '#13274a',
        lineHeight: 1.2,
    },
    subtitle: {
        color: theme.palette.text.secondary,
        lineHeight: 1.4,
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        flexShrink: 0,
    },
    saveButton: {
        textTransform: 'none',
        borderRadius: 10,
        fontWeight: 600,
    },
    closeButton: {
        border: `1px solid ${theme.palette.divider}`,
    },
    tabsAppBar: {
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: '#fff',
    },
    tabList: {
        '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 48,
        },
    },
    dialogContent: {
        padding: 0,
        backgroundColor: '#fcfdff',
    },
    tabPanel: {
        padding: theme.spacing(2),
    },
}));

const getPasswordRuleError = (value, label) => {
    if (!value || value.length === 40) {
        return '';
    }

    const missingRules = [];
    if (!/[A-Z]/.test(value)) {
        missingRules.push('at least one uppercase letter');
    }
    if (!/[0-9]/.test(value)) {
        missingRules.push('at least one number');
    }
    if (!/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(value)) {
        missingRules.push('at least one symbol (!#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~)');
    }

    if (missingRules.length === 0) {
        return '';
    }

    return `${label} must include ${missingRules.join(', ')}`;
};

const AddOrEditUserModal = props => {
    const { open, selectedItem, onClose } = props;
    const { showAlert } = useAlertDialog();
    const { enqueueSnackbar } = useSnackbar();
    const { showLoading } = useLoading();
    const classes = useStyles();
    const [value, setValue] = useState('0');

    const { user } = useAuth();

    const isAdministrator = hasPermission({
        user,
        roles: ['Administrator'],
    });

    useEffect(() => {
        setValue('0');
    }, [open, selectedItem]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const addUser = userPayload => axios.post('/api/users', { ...userPayload });
    const updateUser = userPayload => axios.put('/api/users', { ...userPayload });

    const onSubmitHandler = async values => {
        showLoading(true);
        try {
            if (!selectedItem) {
                await addUser(values);
            } else {
                await updateUser(values);
            }

            enqueueSnackbar('Saved successfully', {
                variant: 'success',
            });
            onClose && onClose();
        } catch (err) {
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error',
            });
            showAlert({
                title: 'Alert',
                message,
            });
        } finally {
            showLoading(false);
        }
    };

    const onCloseHandler = (event, reason) => {
        if (reason === 'backdropClick') {
            return;
        }
        onClose && onClose();
    };

    const tabs = useMemo(
        () => [
            {
                label: 'User Info',
                component: <UserFormTab isEdit={selectedItem !== null} />,
            },
            {
                label: 'User Roles',
                visible: isAdministrator,
                component: <UserRoleTab />,
            },
            {
                label: 'User System Programs',
                visible: isAdministrator,
                component: <UserSystemProgramTab />,
            },
            {
                label: 'User Stations',
                component: <UserStationTab isEdit={selectedItem !== null} />,
            },
        ],
        [isAdministrator, selectedItem]
    );

    const validationSchema = Yup.object({
        emp_no: Yup.string().required('Emp No is required'),
        emp_name: Yup.string().required('Emp Name is required'),
        emp_pass: Yup.string().required('Emp Pass is required').min(8),
        emp_bc: Yup.string().required('Emp BC is required').min(8),
        emp_pwd_pass: Yup.string(),
    });

    return (
        <Dialog
            fullWidth
            maxWidth='lg'
            open={open}
            onClose={onCloseHandler}
            classes={{
                paper: classes.dialogPaper,
            }}
        >
            <Formik
                enableReinitialize
                initialValues={{
                    emp_no: selectedItem?.emp_no || '',
                    emp_name: selectedItem?.emp_name || '',
                    emp_rank: selectedItem?.emp_rank || '0',
                    class_name: selectedItem?.class_name || '',
                    station_name: selectedItem?.station_name || '',
                    emp_pass: selectedItem?.emp_pass || '',
                    emp_bc: selectedItem?.emp_bc || '',
                    emp_pwd_pass: selectedItem?.emp_pwd_pass || '',
                    email: selectedItem?.email || '',
                    dept_name: selectedItem?.dept_name || 'PD',
                    owner: selectedItem?.owner || '',
                    quit_date: selectedItem?.quit_date || new Date(2000, 12, 31),
                    roles: selectedItem ? selectedItem.roles : [],
                    systemPrograms: selectedItem ? selectedItem.systemPrograms : [],
                    stations: selectedItem ? selectedItem.stations : [],
                    checkPasswordRule: true,
                }}
                validationSchema={validationSchema}
                onSubmit={onSubmitHandler}
                validate={values => {
                    const errors = {};

                    if (values.checkPasswordRule) {
                        const empPassError = getPasswordRuleError(values.emp_pass, 'Emp Pass');
                        if (empPassError) {
                            errors.emp_pass = empPassError;
                        }

                        const empBcError = getPasswordRuleError(values.emp_bc, 'Emp BC');
                        if (empBcError) {
                            errors.emp_bc = empBcError;
                        }

                        const empPwdPassError = getPasswordRuleError(values.emp_pwd_pass, 'Emp Pwd Pass');
                        if (empPwdPassError) {
                            errors.emp_pwd_pass = empPwdPassError;
                        }
                    }

                    return errors;
                }}
            >
                {() => {
                    const visibleTabs = tabs.filter(tab => tab.visible === undefined || tab.visible);
                    const modeText = selectedItem ? 'Edit User' : 'Add New User';

                    return (
                        <Form>
                            <div className={classes.root}>
                                <Box className={classes.header}>
                                    <div className={classes.headerInfo}>
                                        <Typography variant='h6' className={classes.title}>
                                            {modeText}
                                        </Typography>
                                        <Typography variant='body2' className={classes.subtitle}>
                                            Fill the information below to configure user profile and access settings.
                                        </Typography>
                                    </div>
                                    <div className={classes.headerActions}>
                                        <Button
                                            size='small'
                                            type='submit'
                                            variant='contained'
                                            color='primary'
                                            className={classes.saveButton}
                                            startIcon={<SaveIcon />}
                                        >
                                            Save
                                        </Button>
                                        <IconButton onClick={onClose} color='inherit' className={classes.closeButton}>
                                            <CloseIcon />
                                        </IconButton>
                                    </div>
                                </Box>

                                <TabContext value={value}>
                                    <AppBar position='static' className={classes.tabsAppBar} color='inherit'>
                                        <TabList
                                            onChange={handleChange}
                                            aria-label='Users'
                                            variant='scrollable'
                                            scrollButtons='auto'
                                            className={classes.tabList}
                                        >
                                            {visibleTabs.map((tab, index) => (
                                                <Tab key={tab.label} value={`${index}`} label={tab.label} />
                                            ))}
                                        </TabList>
                                    </AppBar>

                                    <DialogContent dividers className={classes.dialogContent}>
                                        {visibleTabs.map((tab, index) => (
                                            <TabPanel key={tab.label} value={`${index}`} className={classes.tabPanel}>
                                                {tab.component}
                                            </TabPanel>
                                        ))}
                                    </DialogContent>
                                </TabContext>
                            </div>
                        </Form>
                    );
                }}
            </Formik>
        </Dialog>
    );
};

export default AddOrEditUserModal;

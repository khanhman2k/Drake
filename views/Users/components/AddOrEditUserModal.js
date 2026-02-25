import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Grid from '@material-ui/core/Grid';
import Tab from '@material-ui/core/Tab';
import Dialog from '@material-ui/core/Dialog';
import TabContext from '@material-ui/lab/TabContext';
import TabList from '@material-ui/lab/TabList';
import TabPanel from '@material-ui/lab/TabPanel';
import SaveIcon from '@material-ui/icons/Save';
import CloseIcon from '@material-ui/icons/Close'
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
const useStyles = makeStyles((theme) => ({
    diaglogPaper: {
        minHeight: '60%'
    },
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
    },
    saveButton: {
        color: theme.palette.primary[1]
    }
}));




const AddOrEditUserModal = (props) => {
    const { open, selectedItem, onClose } = props;
    const { showAlert } = useAlertDialog();
    const { enqueueSnackbar } = useSnackbar();
    const { showLoading } = useLoading();

    const classes = useStyles();
    const [value, setValue] = useState('0');

    const { user } = useAuth();

    const isAdministrator = hasPermission({
        user,
        roles: ["Administrator"]
    });
    console.log(`Administrator: ${isAdministrator}`);


    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const AddUser = (user) => {
        return axios.post('/api/users', {
            ...user
        });


    };
    const UpdateUser = (user) => {
        return axios.put('/api/users', {
            ...user
        });
    };

    const onSubmitHandler = async (values, actions) => {

        showLoading(true);
        try {


            console.log(values);
            if (!selectedItem) {
                await AddUser(values);
            } else {
                await UpdateUser(values);
            }

            onClose && onClose();
            showLoading(false);

        } catch (err) {
            console.log(err);
            showLoading(false);
            const { message } = getErrorMessage(err);
            enqueueSnackbar(message, {
                variant: 'error'
            });
            showAlert({
                title: 'Alert',
                message: message
            });

        }

    };

    const onCloseHandler = (event, reason) => {
        console.log(reason);
        if (reason === 'backdropClick') return;
        onClose && onClose();
    };

    const tabs = [
        {
            value: '1',
            label: 'User Info',

            component: <UserFormTab isEdit={selectedItem !== null} />
        },
        {
            value: '2',
            label: 'User Roles',
            visible: isAdministrator ? true : false,
            component: <UserRoleTab />
        },
        {
            value: '3',
            label: 'User System Programs',
            visible: isAdministrator ? true : false,
            component: <UserSystemProgramTab />
        },
        {
            value: '4',
            label: 'User Stations',
            //visible: isAdministrator ? true : false,
            //visible: isLineLeader ? true : false,
            component: <UserStationTab isEdit={selectedItem !== null} />
        },
    ];

    const validationSchema = Yup.object({
        emp_no: Yup.string().required('Emp No is required'),
        emp_name: Yup.string().required('Emp Name is required'),
        emp_pass: Yup.string().required('Emp Pass is required').min(8),
        emp_bc: Yup.string().required('Emp BC is required')
            .min(8),
        emp_pwd_pass: Yup.string(),
    });

    return (
        <Dialog fullWidth maxWidth='md' open={open} onClose={onCloseHandler} classes={{
            paper: classes.diaglogPaper
        }}>
            <Formik
                enableReinitialize={true}
                initialValues={{
                    emp_no: selectedItem ? selectedItem.emp_no ? selectedItem.emp_no : '' : '',
                    emp_name: selectedItem ? selectedItem.emp_name ? selectedItem.emp_name : '' : '',
                    emp_rank: selectedItem ? selectedItem.emp_rank ? selectedItem.emp_rank : '0' : '0',
                    class_name: selectedItem ? selectedItem.class_name ? selectedItem.class_name : '' : '',
                    station_name: selectedItem ? selectedItem.station_name ? selectedItem.station_name : '' : '',
                    emp_pass: selectedItem ? selectedItem.emp_pass ? selectedItem.emp_pass : '' : '',
                    emp_bc: selectedItem ? selectedItem.emp_bc ? selectedItem.emp_bc : '' : '',
                    emp_pwd_pass: selectedItem ? selectedItem.emp_pwd_pass ? selectedItem.emp_pwd_pass : '' : '',
                    email: selectedItem ? selectedItem.email ? selectedItem.email : '' : '',
                    dept_name: selectedItem ? selectedItem.dept_name ? selectedItem.dept_name : 'PD' : 'PD',
                    owner: selectedItem ? selectedItem.owner ? selectedItem.owner : '' : '',
                    quit_date: selectedItem ? selectedItem.quit_date ? selectedItem.quit_date : '' : new Date(2000, 12, 31),
                    roles: selectedItem ? selectedItem.roles : [],
                    systemPrograms: selectedItem ? selectedItem.systemPrograms : [],
                    stations: selectedItem ? selectedItem.stations : [],
                    checkPasswordRule: true,
                }}
                validationSchema={validationSchema}
                onSubmit={onSubmitHandler}
                validate={(values) => {
                    let errors = {};


                    if (values.checkPasswordRule && values.emp_pass && values.emp_pass.length !== 40) {
                        const hasUpperCase = /[A-Z]/.test(values.emp_pass);
                        let msg =`Emp Pass must be have`;
                        if (!hasUpperCase) {

                            msg +=`${msg.indexOf('at least') >-1 ? ' and': ''} at least one UpperCase`;

                        }
                        const hasNumber = /[0-9]/.test(values.emp_pass);
                        if(!hasNumber)
                        {
                            msg += `${msg.indexOf('at least') >-1 ? ' and': ''} at least one Number`;
                        }
                        //const hasLowerCase = /[a-z]/.test(value);
                        const hasSymbole = /["!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"]/.test(values.emp_pass);
                        if(!hasSymbole) 
                        {
                            msg += `${msg.indexOf('at least') >-1 ? ' and': ''} at least one Symbol(!#$%&'()*+,-./:;<=>?@[\]^_\`{|}~)`;
                        }
                        if(!hasUpperCase || !hasNumber || !hasSymbole)
                        {
                            errors['emp_pass'] = msg;
                        }
                    }
                    if (values.checkPasswordRule  && values.emp_bc && values.emp_bc.length !== 40) {
                        const hasUpperCase = /[A-Z]/.test(values.emp_bc);
                        let msg =`Emp BC must be have`;
                        if (!hasUpperCase) {

                            msg +=`${msg.indexOf('at least') >-1 ? ' and': ''} at least one UpperCase`;

                        }
                        const hasNumber = /[0-9]/.test(values.emp_bc);
                        if(!hasNumber)
                        {
                            msg += `${msg.indexOf('at least') >-1 ? ' and': ''} at least one Number`;
                        }
                        //const hasLowerCase = /[a-z]/.test(value);
                        const hasSymbole = /["!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"]/.test(values.emp_bc);
                        if(!hasSymbole) 
                        {
                            msg += `${msg.indexOf('at least') >-1 ? ' and': ''} at least one Symbol(!#$%&'()*+,-./:;<=>?@[\]^_\`{|}~)`;
                        }
                        if(!hasUpperCase || !hasNumber || !hasSymbole)
                        {
                            errors['emp_bc'] = msg;
                        }
                    }
                    if (values.checkPasswordRule && values.emp_pwd_pass && values.emp_pwd_pass.length !== 40) {
                        const hasUpperCase = /[A-Z]/.test(values.emp_pwd_pass);
                        let msg =`Emp Pwd Pass must be have`;
                        if (!hasUpperCase) {

                            msg +=`${msg.indexOf('at least') >-1 ? ' and': ''} at least one UpperCase`;

                        }
                        const hasNumber = /[0-9]/.test(values.emp_pwd_pass);
                        if(!hasNumber)
                        {
                            msg += `${msg.indexOf('at least') >-1 ? ' and': ''} at least one Number`;
                        }
                        //const hasLowerCase = /[a-z]/.test(value);
                        const hasSymbole = /["!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"]/.test(values.emp_pwd_pass);
                        if(!hasSymbole) 
                        {
                            msg += `${msg.indexOf('at least') >-1 ? ' and': ''} at least one Symbol(!#$%&'()*+,-./:;<=>?@[\]^_\`{|}~)`;
                        }
                        if(!hasUpperCase || !hasNumber || !hasSymbole)
                        {
                            errors['emp_pwd_pass'] = msg;
                        }
                    }
                    return errors;
                }}
            >
                {props =>
                    <Form>



                        <div className={classes.root}>
                            <TabContext value={value}>
                                <AppBar position="static" color='inherit'>
                                    <Grid container>
                                        <Grid item>
                                            <TabList onChange={handleChange} aria-label="Users">
                                                {tabs.filter(t => {
                                                    console.log(`Visible: ${t.visible}`);
                                                    if (t.visible === undefined) {
                                                        return true;
                                                    }
                                                    return t.visible === true;
                                                }).map((tab, index) => {
                                                    return <Tab key={index} value={`${index}`} label={tab.label} />
                                                })}
                                                {/*<Tab label="User Form" value="1" />
                                                <Tab label="User Roles" value="2" disabled={isAdministrator ? false : true} />
                                                <Tab label="User System Programs" value="3" disabled={isAdministrator ? false : true} />
                                                <Tab label="User Stations" value="4" />
                                                */}

                                            </TabList>
                                        </Grid>
                                        <Grid item sm />
                                        <Grid item>
                                            <Button size='small' type='submit' variant='outlined' color='primary' startIcon={
                                                <SaveIcon />
                                            }>
                                                Save
                                            </Button>
                                            <IconButton onClick={onClose} color='inherit'>
                                                <CloseIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </AppBar>
                                {tabs.filter(t => {
                                    if (t.visible === undefined) {
                                        return true;
                                    }
                                    return t.visible === true;
                                }).map((tab, index) => {
                                    return <TabPanel key={index} value={`${index}`}>
                                        {tab.component}
                                    </TabPanel>
                                })}
                                {/*<TabPanel value="1"><UserFormTab isEdit={selectedItem !== null} /></TabPanel>
                                <TabPanel value="2"> {isAdministrator && <UserRoleTab />}</TabPanel>
                                <TabPanel value="3"> {isAdministrator && <UserSystemProgramTab />}</TabPanel>
                                <TabPanel value="4"><UserStationTab /></TabPanel>
                                */}
                            </TabContext>
                        </div>


                    </Form>
                }
            </Formik>
        </Dialog >
    );
};

export default AddOrEditUserModal;

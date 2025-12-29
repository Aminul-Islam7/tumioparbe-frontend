'use client';

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { userApi, authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import {
    User,
    Home,
    Phone,
    Mail,
    Facebook,
    Loader2,
    Lock,
    Eye,
    EyeOff,
    LogOut,
} from 'lucide-react';

// Form validation schema for profile
const ParentProfileSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    phone: Yup.string()
        .matches(/^01[2-9]\d{8}$/, 'Please enter a valid 11-digit phone number')
        .required('Phone number is required'),
    address: Yup.string().required('Address is required'),
    facebook_profile: Yup.string()
        .matches(
            /^(https?:\/\/)?(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9(.?)?]/,
            'Please enter a valid Facebook URL'
        )
        .required('Facebook profile is required'),
    email: Yup.string().email('Invalid email address'),
});

// Form validation schema for password change
const ChangePasswordSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your new password'),
});

export default function ProfilePage() {
    const router = useRouter();
    const { user, updateUser, logout } = useAuth(true);
    const { showSuccess, showError } = useToast();
    const [savingParent, setSavingParent] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    // Handle parent profile update
    const handleUpdateProfile = async (values: any) => {
        try {
            setSavingParent(true);
            const response = await userApi.updateProfile(values);
            if (response.data.success && response.data.data) {
                updateUser(response.data.data);
                showSuccess('Success', 'Your profile has been updated.');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            showError('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSavingParent(false);
        }
    };

    // Handle password change
    const handleChangePassword = async (
        values: { currentPassword: string; newPassword: string; confirmPassword: string },
        { resetForm }: { resetForm: () => void }
    ) => {
        try {
            setChangingPassword(true);
            const response = await authApi.changePassword(
                values.currentPassword,
                values.newPassword,
                values.confirmPassword
            );
            if (response.data.success) {
                showSuccess('Success', 'Your password has been changed successfully.');
                resetForm();
            }
        } catch (error: any) {
            console.error('Failed to change password:', error);
            const errorMessage =
                error.response?.data?.errors?.current_password?.[0] ||
                error.response?.data?.errors?.new_password?.[0] ||
                error.response?.data?.message ||
                'Failed to change password. Please try again.';
            showError('Error', errorMessage);
        } finally {
            setChangingPassword(false);
        }
    };

    if (!user) {
        return <div className="p-8 text-center">Loading profile data...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Profile Information Section */}
            <div className="bg-background rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-6">Profile Information</h2>

                <Formik
                    initialValues={{
                        name: user.name || '',
                        phone: user.phone || '',
                        address: user.address || '',
                        facebook_profile: user.facebook_profile || '',
                        email: user.email || '',
                    }}
                    validationSchema={ParentProfileSchema}
                    onSubmit={handleUpdateProfile}
                    enableReinitialize
                >
                    {({ isValid, dirty }) => (
                        <Form className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" /> Full Name
                                    </label>
                                    <Field
                                        name="name"
                                        type="text"
                                        className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                    />
                                    <ErrorMessage
                                        name="name"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> Phone Number
                                    </label>
                                    <Field
                                        name="phone"
                                        type="text"
                                        disabled={true}
                                        className="flex h-10 w-full rounded-md border bg-muted px-3 py-2 text-sm cursor-not-allowed"
                                    />
                                    <ErrorMessage
                                        name="phone"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Facebook Profile */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Facebook className="h-4 w-4" /> Facebook Profile
                                    </label>
                                    <Field
                                        name="facebook_profile"
                                        type="text"
                                        className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                    />
                                    <ErrorMessage
                                        name="facebook_profile"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> Email (Optional)
                                    </label>
                                    <Field
                                        name="email"
                                        type="email"
                                        className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                    />
                                    <ErrorMessage
                                        name="email"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Home className="h-4 w-4" /> Address
                                </label>
                                <Field
                                    name="address"
                                    as="textarea"
                                    rows={3}
                                    className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                />
                                <ErrorMessage
                                    name="address"
                                    component="div"
                                    className="text-red-500 text-xs"
                                />
                            </div>

                            {/* Submit button */}
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    className="bg-tp_red hover:bg-red-600"
                                    disabled={savingParent || !dirty || !isValid}
                                >
                                    {savingParent ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>Save Changes</>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>

            {/* Change Password Section */}
            <div className="bg-background rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Lock className="h-5 w-5" /> Change Password
                </h2>

                <Formik
                    initialValues={{
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                    }}
                    validationSchema={ChangePasswordSchema}
                    onSubmit={handleChangePassword}
                >
                    {({ isValid, dirty }) => (
                        <Form className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                {/* Current Password */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            name="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <ErrorMessage
                                        name="currentPassword"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* New Password */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            name="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <ErrorMessage
                                        name="newPassword"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Confirm New Password */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <ErrorMessage
                                        name="confirmPassword"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Submit button */}
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    className="bg-tp_red hover:bg-red-600"
                                    disabled={changingPassword || !dirty || !isValid}
                                >
                                    {changingPassword ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Changing...
                                        </>
                                    ) : (
                                        <>Change Password</>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>

            {/* Logout Section */}
            <div className="bg-background rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <LogOut className="h-5 w-5" /> Logout
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Sign out of your account. You'll need to log in again to access your dashboard.
                </p>
                <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout from Account
                </Button>
            </div>
        </div>
    );
}


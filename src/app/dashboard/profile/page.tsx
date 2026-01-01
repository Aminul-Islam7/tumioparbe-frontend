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
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 animate-pulse" />
                    <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-body-muted mt-4">Loading profile data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Information and Change Password - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Information Section */}
                <div className="bg-card-profile-bg border-2 border-card-profile-border rounded-card p-6 shadow-card">
                    <h2 className="text-xl font-bold text-heading mb-6">Profile Information</h2>

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
                        enableReinitialize={true}
                    >
                        {({ errors, touched, dirty, isValid }) => (
                            <Form className="space-y-4">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium text-heading flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" />
                                        Name
                                    </label>
                                    <Field
                                        id="name"
                                        name="name"
                                        type="text"
                                        className={`flex h-12 w-full rounded-xl border bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all ${
                                            errors.name && touched.name ? 'border-error' : 'border-neutral-200 dark:border-neutral-700'
                                        }`}
                                    />
                                    <ErrorMessage name="name" component="div" className="text-error text-sm" />
                                </div>

                                {/* Phone Field */}
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium text-heading flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-secondary" />
                                        Phone Number
                                    </label>
                                    <Field
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        disabled
                                        className="flex h-12 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm cursor-not-allowed"
                                    />
                                    <p className="text-xs text-body-muted">Phone number cannot be changed</p>
                                </div>

                                {/* Address Field */}
                                <div className="space-y-2">
                                    <label htmlFor="address" className="text-sm font-medium text-heading flex items-center gap-2">
                                        <Home className="h-4 w-4 text-lavender-500" />
                                        Address
                                    </label>
                                    <Field
                                        id="address"
                                        name="address"
                                        as="textarea"
                                        rows={3}
                                        className={`flex w-full rounded-xl border bg-card px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all ${
                                            errors.address && touched.address ? 'border-error' : 'border-neutral-200 dark:border-neutral-700'
                                        }`}
                                    />
                                    <ErrorMessage name="address" component="div" className="text-error text-sm" />
                                </div>

                                {/* Facebook Profile Field */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="facebook_profile"
                                        className="text-sm font-medium text-heading flex items-center gap-2"
                                    >
                                        <Facebook className="h-4 w-4 text-secondary" />
                                        Facebook Profile
                                    </label>
                                    <Field
                                        id="facebook_profile"
                                        name="facebook_profile"
                                        type="text"
                                        className={`flex h-12 w-full rounded-xl border bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all ${
                                            errors.facebook_profile && touched.facebook_profile
                                                ? 'border-error'
                                                : 'border-neutral-200 dark:border-neutral-700'
                                        }`}
                                    />
                                    <ErrorMessage
                                        name="facebook_profile"
                                        component="div"
                                        className="text-error text-sm"
                                    />
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-heading flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-tangerine-500" />
                                        Email (Optional)
                                    </label>
                                    <Field
                                        id="email"
                                        name="email"
                                        type="email"
                                        className={`flex h-12 w-full rounded-xl border bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all ${
                                            errors.email && touched.email ? 'border-error' : 'border-neutral-200 dark:border-neutral-700'
                                        }`}
                                    />
                                    <ErrorMessage name="email" component="div" className="text-error text-sm" />
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
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
                <div className="bg-card-assignments-bg border-2 border-card-assignments-border rounded-card p-6 shadow-card">
                    <h2 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-lavender-500" />
                        Change Password
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
                        {({ errors, touched, dirty, isValid }) => (
                            <Form className="space-y-4">
                                {/* Current Password */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="currentPassword"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            id="currentPassword"
                                            name="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                                errors.currentPassword && touched.currentPassword
                                                    ? 'border-red-500'
                                                    : 'border-input'
                                            }`}
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
                                        className="text-red-500 text-sm"
                                    />
                                </div>

                                {/* New Password */}
                                <div className="space-y-2">
                                    <label htmlFor="newPassword" className="text-sm font-medium flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            id="newPassword"
                                            name="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                                errors.newPassword && touched.newPassword
                                                    ? 'border-red-500'
                                                    : 'border-input'
                                            }`}
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
                                    <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm" />
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="confirmPassword"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                                errors.confirmPassword && touched.confirmPassword
                                                    ? 'border-red-500'
                                                    : 'border-input'
                                            }`}
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
                                        className="text-red-500 text-sm"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        variant="lavender"
                                        className="w-full"
                                        size="lg"
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
            </div>

            {/* Logout Section */}
            <div className="flex justify-center pt-4">
                <Button
                    onClick={handleLogout}
                    variant="destructive"
                    size="lg"
                    className="px-12 py-6 text-lg rounded-2xl"
                >
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout from Account
                </Button>
            </div>
        </div>
    );
}

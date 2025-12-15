'use client';

import React, { useState, useEffect } from 'react';
import { FileUploader } from './FileUploader';
import { API_BASE_URL } from '@/lib/api';
import {
    Lock, Eye, EyeOff, Shield, Download,
    AlertCircle, Check, FileText
} from 'lucide-react';

interface ProtectionSettings {
    userPassword: string;
    encryption: 'AES-256' | 'AES-128' | 'RC4-128';
    restrictPermissions: boolean;
    permissions: {
        printing: 'none' | 'low' | 'high';
        copying: boolean;
        modifying: 'none' | 'minimal' | 'all';
    }
}

export function ProtectPdfTool() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'upload' | 'settings' | 'processing' | 'success'>('upload');
    const [error, setError] = useState('');

    // Settings State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [settings, setSettings] = useState<ProtectionSettings>({
        userPassword: '',
        encryption: 'AES-256',
        restrictPermissions: false,
        permissions: {
            printing: 'high',
            copying: true,
            modifying: 'all'
        }
    });

    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // Password Strength Calculation
    const getPasswordStrength = (pwd: string) => {
        if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score < 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
        if (score < 4) return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
        return { score: 3, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setStatus('settings');
            setError('');
        }
    };

    const handleProtect = async () => {
        if (!file) return;
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setStatus('processing');
        setError('');

        const formData = new FormData();
        formData.append('files', file);

        const props = {
            user_password: password,
            encryption: settings.encryption,
            permissions: settings.restrictPermissions ? settings.permissions : null
        };
        formData.append('properties', JSON.stringify(props));

        try {
            const res = await fetch(`${API_BASE_URL}/api/tools/protect`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (result.success) {
                setDownloadUrl(result.downloadUrl);
                setStatus('success');
            } else {
                throw new Error(result.error || 'Protection failed');
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'An error occurred during protection.';
            setError(errorMessage);
            setStatus('settings');
        }
    };

    const reset = () => {
        setFile(null);
        setStatus('upload');
        setPassword('');
        setConfirmPassword('');
        setDownloadUrl(null);
        setError('');
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* 1. UPLOAD SECTION */}
            {status === 'upload' && (
                <FileUploader
                    onFilesSelected={handleFilesSelected}
                    accept={{ "application/pdf": [".pdf"] }}
                    multiple={false}
                />
            )}

            {/* 2. SETTINGS SECTION */}
            {status === 'settings' && file && (
                <div className="flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4">

                    {/* LEFT: File Info */}
                    <div className="md:w-1/3">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-gray-800 break-words mb-1">{file.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button onClick={reset} className="text-red-500 text-sm font-medium hover:underline">Change File</button>
                        </div>
                    </div>

                    {/* RIGHT: Settings Form */}
                    <div className="md:w-2/3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-gray-800" /> Protection Settings
                        </h2>

                        {/* Password Fields */}
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Set Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono"
                                        placeholder="Enter password..."
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {password && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">{passwordStrength.label}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-mono ${password && confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-red-500'}`}
                                    placeholder="Repeat password..."
                                />
                                {password && confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Passwords do not match</p>
                                )}
                            </div>
                        </div>

                        {/* Advanced Options Toggle */}
                        <div className="border-t border-gray-100 pt-6">
                            <button
                                onClick={() => setSettings(s => ({ ...s, restrictPermissions: !s.restrictPermissions }))}
                                className="flex items-center justify-between w-full text-left mb-4 group"
                            >
                                <span className="font-bold text-gray-700 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                                    Limit Permissions (Printing, Copying)
                                </span>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.restrictPermissions ? 'bg-red-500' : 'bg-gray-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.restrictPermissions ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </button>

                            {settings.restrictPermissions && (
                                <div className="space-y-4 pl-4 border-l-2 border-red-100 animate-in fade-in slide-in-from-top-2">
                                    {/* Printing */}
                                    <div>
                                        <span className="block text-sm font-semibold text-gray-600 mb-2">Printing</span>
                                        <div className="flex gap-2">
                                            {['none', 'low', 'high'].map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setSettings(s => ({ ...s, permissions: { ...s.permissions, printing: opt as 'none' | 'low' | 'high' } }))}
                                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${settings.permissions.printing === opt
                                                        ? 'bg-red-50 border-red-500 text-red-700 font-bold'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                >
                                                    {opt === 'none' ? 'Blocking' : opt === 'low' ? 'Low Quality' : 'High Quality'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Edit/Copy */}
                                    <div className="flex flex-col gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.permissions.copying}
                                                onChange={(e) => setSettings(s => ({ ...s, permissions: { ...s.permissions, copying: e.target.checked } }))}
                                                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-600">Allow Copying Content</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.permissions.modifying === 'all'}
                                                onChange={(e) => setSettings(s => ({ ...s, permissions: { ...s.permissions, modifying: e.target.checked ? 'all' : 'none' } }))}
                                                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-600">Allow Modifying Document</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={handleProtect}
                            disabled={!password || password.length < 6}
                            className={`w-full mt-8 py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                                ${!password || password.length < 6
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 hover:shadow-xl hover:-translate-y-1'}`}
                        >
                            Protect PDF <Lock className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* 3. PROCESSING STATE */}
            {status === 'processing' && (
                <div className="py-20 text-center animate-in fade-in">
                    <div className="relative w-20 h-20 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <Shield className="absolute inset-0 m-auto text-red-500 w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Encrypting Document...</h3>
                    <p className="text-gray-500">Applying military-grade AES-256 encryption.</p>
                </div>
            )}

            {/* 4. SUCCESS STATE */}
            {status === 'success' && downloadUrl && (
                <div className="py-12 text-center animate-in fade-in zoom-in-95 max-w-lg mx-auto">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Check className="w-12 h-12" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-gray-800 mb-2">PDF Protected!</h2>
                    <p className="text-gray-600 mb-8">Your document is now encrypted and secure.</p>

                    <a
                        href={`${API_BASE_URL}${downloadUrl}`}
                        download
                        className="block w-full bg-red-600 text-white font-bold py-4 rounded-xl text-xl hover:bg-red-700 shadow-xl transition-all flex items-center justify-center gap-3 mb-4"
                    >
                        <Download className="w-6 h-6" /> Download Protected PDF
                    </a>

                    <button
                        onClick={reset}
                        className="text-gray-500 font-medium hover:text-gray-700 hover:underline"
                    >
                        Protect Another File
                    </button>

                    <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-left flex gap-3 text-sm text-yellow-800">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <strong>Important:</strong> We do not store your password. If you forget it, this file cannot be recovered.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import {
    associateDeviceApi,
    createHomeApi,
    deleteHomeApi,
    disassociateDeviceApi,
    getDevicesByHomeApi,
    getMyHomesApi,
    updateDeviceApi,
    updateHomeApi,
} from '@/lib/api';
import { Plus, Home as HomeIcon, MapPin, Trash2, Cpu, Pencil, X } from 'lucide-react';
import type { Home, Device } from '@/types';

export default function HomesPage() {
    const {
        homes,
        setHomes,
        addHome,
        updateHome,
        removeHome,
        setDevicesForHome,
        updateDeviceInHome,
        removeDevice,
        isHomesLoaded,
    } = useSettingsStore();

    const [loadingHomes, setLoadingHomes] = useState(true);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [homesError, setHomesError] = useState('');
    const [deviceError, setDeviceError] = useState('');

    // State for New Home Form
    const [isAddingHome, setIsAddingHome] = useState(false);
    const [newHomeName, setNewHomeName] = useState('');
    const [newHomeLocation, setNewHomeLocation] = useState('');
    const [savingHome, setSavingHome] = useState(false);

    // State for New Device Form
    const [addingDeviceToHomeId, setAddingDeviceToHomeId] = useState<string | null>(null);
    const [newDeviceName, setNewDeviceName] = useState('');
    /** External / hardware device id (AssociateDeviceDto.deviceId) */
    const [newDeviceExternalId, setNewDeviceExternalId] = useState('');
    const [savingDevice, setSavingDevice] = useState(false);

    const [editingDevice, setEditingDevice] = useState<{ homeId: string; deviceId: string } | null>(null);
    const [editDeviceName, setEditDeviceName] = useState('');

    // State for Edit Home
    const [editingHomeId, setEditingHomeId] = useState<string | null>(null);
    const [editHomeName, setEditHomeName] = useState('');
    const [editHomeLocation, setEditHomeLocation] = useState('');

    const editingHome = useMemo(
        () => (editingHomeId ? homes.find((h) => h.id === editingHomeId) : undefined),
        [editingHomeId, homes]
    );

    const editingDeviceMeta = useMemo(() => {
        if (!editingDevice) return undefined;
        const home = homes.find((h) => h.id === editingDevice.homeId);
        const device = home?.devices?.find((d) => d.id === editingDevice.deviceId);
        return home && device ? { home, device } : undefined;
    }, [editingDevice, homes]);

    const homeIdsKey = useMemo(() => homes.map((h) => h.id).sort().join(','), [homes]);

    useEffect(() => {
        // Skip loading if homes were already preloaded in AuthProvider
        if (isHomesLoaded) {
            setLoadingHomes(false);
            return;
        }

        let cancelled = false;
        setLoadingHomes(true);
        setHomesError('');
        getMyHomesApi()
            .then((data) => {
                if (cancelled) return;
                setHomes(data || []);
            })
            .catch((err: any) => {
                if (cancelled) return;
                setHomesError(err?.message || 'Failed to load homes');
            })
            .finally(() => {
                if (cancelled) return;
                setLoadingHomes(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isHomesLoaded, setHomes]);

    useEffect(() => {
        if (!homeIdsKey) return;
        let cancelled = false;
        setLoadingDevices(true);
        setDeviceError('');
        const ids = homeIdsKey.split(',').filter(Boolean);
        Promise.all(ids.map((hid) => getDevicesByHomeApi(hid, { skip: 0, take: 100 })))
            .then((lists) => {
                if (cancelled) return;
                lists.forEach((devices, i) => setDevicesForHome(ids[i], devices));
            })
            .catch((err: any) => {
                if (cancelled) return;
                setDeviceError(err?.message || 'Failed to load devices');
            })
            .finally(() => {
                if (!cancelled) setLoadingDevices(false);
            });
        return () => {
            cancelled = true;
        };
    }, [homeIdsKey, setDevicesForHome]);

    const handleAddHome = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHomeName.trim() || !newHomeLocation.trim()) return;

        setSavingHome(true);
        setHomesError('');
        try {
            const created = await createHomeApi({
                name: newHomeName.trim(),
                location: newHomeLocation.trim() ? newHomeLocation.trim() : undefined,
            });
            addHome(created);
            setIsAddingHome(false);
            setNewHomeName('');
            setNewHomeLocation('');
        } catch (err: any) {
            setHomesError(err?.message || 'Failed to create home');
        } finally {
            setSavingHome(false);
        }
    };

    const handleAssociateDevice = async (e: React.FormEvent, homeId: string) => {
        e.preventDefault();
        if (!newDeviceName.trim() || !newDeviceExternalId.trim()) return;

        setSavingDevice(true);
        setDeviceError('');
        try {
            const device = await associateDeviceApi({
                deviceId: newDeviceExternalId.trim(),
                homeId,
                name: newDeviceName.trim(),
            });
            const list = await getDevicesByHomeApi(homeId, { skip: 0, take: 100 });
            setDevicesForHome(homeId, list.length ? list : [device]);
            setAddingDeviceToHomeId(null);
            setNewDeviceName('');
            setNewDeviceExternalId('');
        } catch (err: any) {
            setDeviceError(err?.message || 'Failed to associate device');
        } finally {
            setSavingDevice(false);
        }
    };

    const openEditDevice = (homeId: string, device: Device) => {
        setEditingDevice({ homeId, deviceId: device.id });
        setEditDeviceName(device.name || '');
    };

    const handleSaveEditDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDevice || !editDeviceName.trim()) return;

        setSavingDevice(true);
        setDeviceError('');
        try {
            const updated = await updateDeviceApi(editingDevice.deviceId, editingDevice.homeId, {
                name: editDeviceName.trim(),
            });
            updateDeviceInHome(editingDevice.homeId, editingDevice.deviceId, {
                name: updated.name,
                deviceType: updated.deviceType,
                createdAt: updated.createdAt,
            });
            setEditingDevice(null);
        } catch (err: any) {
            setDeviceError(err?.message || 'Failed to update device');
        } finally {
            setSavingDevice(false);
        }
    };

    const handleDisassociateDevice = async (homeId: string, deviceId: string) => {
        if (!confirm('Dissocier cet appareil de cette résidence ?')) return;
        setDeviceError('');
        try {
            await disassociateDeviceApi(deviceId, homeId);
            removeDevice(homeId, deviceId);
        } catch (err: any) {
            setDeviceError(err?.message || 'Impossible de dissocier l’appareil');
        }
    };

    const startEditHome = (home: Home) => {
        setEditingHomeId(home.id);
        setEditHomeName(home.name || '');
        setEditHomeLocation(home.location || '');
    };

    const handleSaveEditHome = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingHomeId) return;
        if (!editHomeName.trim()) return;

        setSavingHome(true);
        setHomesError('');
        try {
            const updated = await updateHomeApi(editingHomeId, {
                name: editHomeName.trim(),
                location: editHomeLocation.trim() ? editHomeLocation.trim() : undefined,
            });
            updateHome(editingHomeId, {
                name: updated.name,
                location: updated.location,
                timezone: updated.timezone,
            });
            setEditingHomeId(null);
        } catch (err: any) {
            setHomesError(err?.message || 'Failed to update home');
        } finally {
            setSavingHome(false);
        }
    };

    const handleDeleteHome = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette résidence ?')) return;
        setHomesError('');
        try {
            await deleteHomeApi(id);
            removeHome(id);
        } catch (err: any) {
            setHomesError(err?.message || 'Failed to delete home');
        }
    };

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Résidences &amp; Appareils</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Gérez vos propriétés surveillées et vos équipements connectés.</p>
                </div>
                <button
                    onClick={() => setIsAddingHome(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-violet-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Ajouter une résidence
                </button>
            </div>

            {homesError && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-200 rounded-2xl px-4 py-3 text-xs font-medium">
                    {homesError}
                </div>
            )}

            {deviceError && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-200 rounded-2xl px-4 py-3 text-xs font-medium">
                    {deviceError}
                </div>
            )}

            {/* Add Home Form */}
            {isAddingHome && (
                <div className="bg-white dark:bg-zinc-900 border border-violet-500/20 rounded-2xl p-5 shadow-xl shadow-black/5 dark:shadow-black/20">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                        <HomeIcon className="w-4 h-4 text-violet-500" />
                        Enregistrer une nouvelle résidence
                    </h3>
                    <form onSubmit={handleAddHome} className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="w-full sm:flex-1 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">Nom de la résidence</label>
                            <input
                                type="text"
                                required
                                value={newHomeName}
                                onChange={(e) => setNewHomeName(e.target.value)}
                                placeholder="Ex. : Maison de vacances"
                                className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                        </div>
                        <div className="w-full sm:flex-1 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">Lieu</label>
                            <input
                                type="text"
                                required
                                value={newHomeLocation}
                                onChange={(e) => setNewHomeLocation(e.target.value)}
                                placeholder="Ex. : Casablanca, Maroc"
                                className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                            <button
                                type="button"
                                onClick={() => setIsAddingHome(false)}
                                className="px-4 py-2 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-1 sm:flex-none"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={savingHome}
                                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors flex-1 sm:flex-none"
                            >
                                {savingHome ? 'Sauvegarde…' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Home Modal */}
            {editingHomeId && editingHome && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingHomeId(null)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Modifier la résidence</h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Mettez à jour les informations de la résidence.</p>
                            </div>
                            <button
                                onClick={() => setEditingHomeId(null)}
                                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                                title="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEditHome} className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">Nom de la résidence</label>
                                <input
                                    type="text"
                                    required
                                    value={editHomeName}
                                    onChange={(e) => setEditHomeName(e.target.value)}
                                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">Lieu</label>
                                <input
                                    type="text"
                                    value={editHomeLocation}
                                    onChange={(e) => setEditHomeLocation(e.target.value)}
                                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingHomeId(null)}
                                    className="px-4 py-2 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingHome}
                                    className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                                >
                                    {savingHome ? 'Sauvegarde…' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Device Modal */}
            {editingDevice && editingDeviceMeta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingDevice(null)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Modifier l’appareil</h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Modifiez le nom d’affichage de l’appareil.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingDevice(null)}
                                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                                title="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEditDevice} className="p-5 space-y-4">
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono break-all">
                                ID: {editingDeviceMeta.device.id}
                            </p>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">Nom</label>
                                <input
                                    type="text"
                                    required
                                    value={editDeviceName}
                                    onChange={(e) => setEditDeviceName(e.target.value)}
                                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingDevice(null)}
                                    className="px-4 py-2 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingDevice}
                                    className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                                >
                                    {savingDevice ? 'Sauvegarde…' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Homes List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loadingHomes && homes.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl p-10 text-center">
                        <div className="w-8 h-8 mx-auto rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Chargement des résidences…</p>
                    </div>
                ) : (
                    homes.map((home) => (
                    <div key={home.id} className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">

                        {/* Home Header */}
                        <div className="p-5 border-b border-black/5 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                                    <HomeIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{home.name}</h3>
                                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        <MapPin className="w-3 h-3" />
                                        <span>{home.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => startEditHome(home)}
                                    className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                                    title="Edit Home"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteHome(home.id)}
                                    className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                                    title="Delete Home"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Devices Section */}
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                    <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                                    Appareils connectés
                                </h4>
                                <button
                                    onClick={() => setAddingDeviceToHomeId(home.id)}
                                    className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                                >
                                    + Associer un appareil
                                </button>
                            </div>

                            {loadingDevices && (
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2">Chargement des appareils…</p>
                            )}

                            {/* Associate device (existing hardware id + name) */}
                            {addingDeviceToHomeId === home.id && (
                                <form onSubmit={(e) => handleAssociateDevice(e, home.id)} className="mb-4 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-black/5 dark:border-white/5 space-y-3">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={newDeviceExternalId}
                                            onChange={(e) => setNewDeviceExternalId(e.target.value)}
                                            placeholder="Identifiant de l’appareil (existant dans le système)"
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono"
                                        />
                                        <input
                                            type="text"
                                            required
                                            value={newDeviceName}
                                            onChange={(e) => setNewDeviceName(e.target.value)}
                                            placeholder="Nom d’affichage"
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAddingDeviceToHomeId(null)}
                                            className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={savingDevice}
                                            className="px-3 py-1.5 text-[10px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg transition-colors disabled:opacity-60"
                                        >
                                            {savingDevice ? 'Association…' : 'Associer'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Devices List */}
                            {home.devices && home.devices.length > 0 ? (
                                <div className="space-y-2">
                                    {home.devices.map(device => (
                                        <div key={device.id} className="flex items-center justify-between p-2.5 rounded-xl border border-black/5 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                    <Cpu className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{device.name}</p>
                                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate font-mono">
                                                        {device.id}
                                                    </p>
                                                    {device.deviceType && (
                                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{device.deviceType}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditDevice(home.id, device)}
                                                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                                    title="Edit device"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDisassociateDevice(home.id, device.id)}
                                                    className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                                    title="Disassociate device"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center mb-3">
                                        <Cpu className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                                    </div>
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Aucun appareil connecté</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Ajoutez un appareil pour commencer la surveillance.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))
                )}

                {homes.length === 0 && (
                    <div className="col-span-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mb-4">
                            <HomeIcon className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Aucune résidence</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">Ajoutez votre première résidence pour commencer à suivre et analyser la consommation énergétique.</p>
                        <button
                            onClick={() => setIsAddingHome(true)}
                            className="mt-6 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                        >
                            + Ajouter une résidence
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

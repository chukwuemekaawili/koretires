import { useState, useEffect } from "react";
import { Check, ChevronDown, Car, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface VehicleSelectorProps {
    onComplete: (tireSize: string) => void;
    className?: string;
}

export function VehicleSelector({ onComplete, className }: VehicleSelectorProps) {
    const [years, setYears] = useState<number[]>([]);
    const [makes, setMakes] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [trims, setTrims] = useState<{ trim: string; id: string }[]>([]);

    const [selectedYear, setSelectedYear] = useState<string>("");
    const [selectedMake, setSelectedMake] = useState<string>("");
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [selectedTrim, setSelectedTrim] = useState<string>("");

    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Initial load: Fetch distinct years
    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('year')
                .order('year', { ascending: false });

            if (error) throw error;

            // Get unique years
            const uniqueYears = [...new Set(data?.map(v => v.year))];
            setYears(uniqueYears);
        } catch (e) {
            console.error("Failed to fetch years:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMakes = async (year: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('make')
                .eq('year', parseInt(year))
                .order('make');

            if (error) throw error;
            const uniqueMakes = [...new Set(data?.map(v => v.make))];
            setMakes(uniqueMakes);
        } catch (e) {
            console.error("Failed to fetch makes:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchModels = async (year: string, make: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('model')
                .eq('year', parseInt(year))
                .eq('make', make)
                .order('model');

            if (error) throw error;
            const uniqueModels = [...new Set(data?.map(v => v.model))];
            setModels(uniqueModels);
        } catch (e) {
            console.error("Failed to fetch models:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrims = async (year: string, make: string, model: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('id, trim')
                .eq('year', parseInt(year))
                .eq('make', make)
                .eq('model', model)
                .order('trim');

            if (error) throw error;
            setTrims(data || []);
        } catch (e) {
            console.error("Failed to fetch trims:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!selectedTrim) return;

        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('vehicle_tire_sizes')
                .select('tire_size')
                .eq('vehicle_id', selectedTrim)
                .limit(1)
                .single();

            if (error) throw error;
            if (data?.tire_size) {
                onComplete(data.tire_size);
            }
        } catch (e) {
            console.error("Failed to fetch tire size:", e);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className={`bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm ${className}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-display font-semibold text-lg">Shop by Vehicle</h3>
                    <p className="text-sm text-muted-foreground hidden sm:block">Find tires that guarantee a perfect fit</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative">
                <Select
                    disabled={isLoading || years.length === 0}
                    value={selectedYear}
                    onValueChange={(val) => {
                        setSelectedYear(val);
                        setSelectedMake("");
                        setSelectedModel("");
                        setSelectedTrim("");
                        fetchMakes(val);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    disabled={!selectedYear || isLoading || makes.length === 0}
                    value={selectedMake}
                    onValueChange={(val) => {
                        setSelectedMake(val);
                        setSelectedModel("");
                        setSelectedTrim("");
                        fetchModels(selectedYear, val);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Make" />
                    </SelectTrigger>
                    <SelectContent>
                        {makes.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    disabled={!selectedMake || isLoading || models.length === 0}
                    value={selectedModel}
                    onValueChange={(val) => {
                        setSelectedModel(val);
                        setSelectedTrim("");
                        fetchTrims(selectedYear, selectedMake, val);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent>
                        {models.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    disabled={!selectedModel || isLoading || trims.length === 0}
                    value={selectedTrim}
                    onValueChange={setSelectedTrim}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Trim" />
                    </SelectTrigger>
                    <SelectContent>
                        {trims.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.trim}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <AnimatePresence>
                {selectedTrim && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    >
                        <Button
                            className="w-full sm:w-auto"
                            onClick={handleSearch}
                            disabled={isSearching}
                        >
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Find Tires for this Vehicle
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

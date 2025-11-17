import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { toast } from "../ui/use-toast";
import { supabase } from "../../lib/customSupabaseClient";

export default function CompanySettings() {
  const [form, setForm] = useState({
    name: "",
    nit: "",
    phone: "",
    address: "",
    logo: ""
  });
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar datos existentes
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("company_info").select("*").maybeSingle();
        if (error) {
          toast({ title: "Error", description: "No se pudo cargar la configuración.", variant: "destructive" });
        }
        if (data) {
          setForm({
            name: data.name || "",
            nit: data.nit || "",
            phone: data.phone || "",
            address: data.address || "",
            logo: data.logo || ""
          });
          setLogoPreview(data.logo || "");
        }
      } catch (err) {
        toast({ title: "Error", description: "Error de conexión o datos.", variant: "destructive" });
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, logo: reader.result }));
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    // upsert: si existe actualiza, si no crea
    const { error } = await supabase.from("company_info").upsert({
      id: 1,
      name: form.name,
      nit: form.nit,
      phone: form.phone,
      address: form.address,
      logo: form.logo
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    } else {
      toast({ title: "Configuración guardada", description: "Los datos de la empresa se han actualizado." });
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Configuración de la Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input name="name" value={form.name} onChange={handleChange} placeholder="Nombre de la empresa" />
          <Input name="nit" value={form.nit} onChange={handleChange} placeholder="NIT" />
          <Input name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono" />
          <Input name="address" value={form.address} onChange={handleChange} placeholder="Dirección" />
          <div>
            <label className="block mb-2">Logo para documentos</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} />
            {logoPreview && <img src={logoPreview} alt="Logo" className="mt-2 h-20" />}
          </div>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

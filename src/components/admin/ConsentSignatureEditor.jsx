import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const ConsentSignatureEditor = ({ initialSignature, initialDate, onSave, loading }) => {
  const sigCanvas = useRef(null);
  const [accepted, setAccepted] = useState(false);
  const [date, setDate] = useState(initialDate || '');

  const handleSave = () => {
    if (sigCanvas.current.isEmpty()) {
      toast({ title: 'Firma requerida', description: 'Por favor, firma en el recuadro.', variant: 'destructive' });
      return;
    }
    if (!accepted) {
      toast({ title: 'Aceptación requerida', description: 'Debes aceptar los términos para continuar.', variant: 'destructive' });
      return;
    }
    const signature = sigCanvas.current.toDataURL('image/png');
    onSave(signature, date || new Date().toISOString());
  };

  return (
    <div className="space-y-4">
      <Label>Fecha de firma</Label>
      <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-2 py-1" />
      <Label>Firma <span className="text-red-500">*</span></Label>
      <div className="border rounded-md mt-1 bg-gray-50">
        <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ className: 'w-full h-40' }} />
      </div>
      <Button variant="link" size="sm" onClick={() => sigCanvas.current.clear()} className="px-0">Limpiar firma</Button>
      <div className="flex items-start space-x-3">
        <input type="checkbox" id="accept-terms" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1" />
        <Label htmlFor="accept-terms" className="cursor-pointer text-sm font-normal">
          CONSIENTO Y MANIFIESTO MI CONFORMIDAD para que se le realice a mi mascota dicho servicio, y acepto el reglamento y las condiciones del SPA.
        </Label>
      </div>
      <Button onClick={handleSave} disabled={loading}>{loading ? 'Guardando...' : 'Guardar consentimiento'}</Button>
    </div>
  );
};

export default ConsentSignatureEditor;

"use client";

import { useState, useEffect } from "react";
import {
    partnerService,
    clinicalService
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSection } from "@/components/forms/FormSection";
import { PartnerDetails } from "@/lib/types";
import { Loader2, User, Building, Award, Phone } from "lucide-react";
import { useAppAuth } from "@/hooks/use-app-auth";

interface PartnerFormProps {
    initialData?: PartnerDetails;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PartnerForm({
    initialData,
    onSuccess,
    onCancel
}: PartnerFormProps) {
    const { toast } = useToast();
    const { token, isLoaded } = useAppAuth();
    const [loading, setLoading] = useState(false);
    const [ufs, setUfs] = useState<{ id: number, nome: string, sigla: string }[]>([]);
    const [specialties, setSpecialties] = useState<{ id: number, nome: string }[]>([]);
    const [degrees, setDegrees] = useState<{ id: number, nome: string }[]>([]);
    const [commTypes, setCommTypes] = useState<{ id: number, descricao: string }[]>([]);

    const isEditing = !!initialData;

    const [form, setForm] = useState({
        cpf: initialData?.cpf || '',
        nome: initialData?.nome || '',
        email: initialData?.email || '',
        senha: '',
        cro: initialData?.cro || '',
        croUf: initialData?.croUf || '',
        telefone: initialData?.telefone || '',
        titulacaoId: 0,
        especialidadesIds: [] as number[],
        comunicacoesIds: [] as number[],

        // Estabelecimento
        cnpj: initialData?.cnpj || '',
        razaoSocial: initialData?.razaoSocial || '',
        endereco: initialData?.endereco || '',
        telefone_estabelecimento: initialData?.telefone_estabelecimento || '',
        complemento: initialData?.complemento || '',
        cep: initialData?.cep || '',
        bairro: initialData?.bairro || '',
        cidade: initialData?.cidade || '',
        uf_estabelecimento: initialData?.uf_estabelecimento || '',
    });

    useEffect(() => {
        async function loadAuxData() {
            if (!isLoaded || !token) return;
            
            try {
                const [ufsRes, specRes, degRes, commRes] = await Promise.all([
                    clinicalService.getUfs(token),
                    clinicalService.getSpecialties(token),
                    clinicalService.getDegrees(token),
                    clinicalService.getCommunicationTypes(token)
                ]);
                setUfs(ufsRes);
                setSpecialties(specRes);
                setDegrees(degRes);
                setCommTypes(commRes);

                // Map initial labels to IDs if editing
                if (initialData) {
                    const foundDegree = degRes.find((d: any) => d.nome === initialData.titulacao);
                    const foundSpecIds = specRes
                        .filter((s: any) => initialData.especialidades?.includes(s.nome))
                        .map((s: any) => s.id);
                    const foundCommIds = commRes
                        .filter((c: any) => initialData.comunicacoes?.includes(c.descricao))
                        .map((c: any) => c.id);

                    setForm(f => ({
                        ...f,
                        titulacaoId: foundDegree?.id || 0,
                        especialidadesIds: foundSpecIds,
                        comunicacoesIds: foundCommIds
                    }));
                }
            } catch (err) {
                console.error("Erro ao carregar dados auxiliares", err);
            }
        }
        loadAuxData();
    }, [isLoaded, token, initialData]);

    const handleSave = async () => {
        // Basic validation
        if (!form.cpf || !form.nome || !form.email || (!isEditing && !form.senha) || !form.cro || !form.croUf || !form.titulacaoId) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, preencha todos os campos marcados com *.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                especialidadesIds: form.especialidadesIds,
                comunicacoesIds: form.comunicacoesIds
            };

            // Remove empty fields for establishment if they are not provided
            if (!payload.cnpj) delete (payload as any).cnpj;
            if (!payload.razaoSocial) delete (payload as any).razaoSocial;
            if (!payload.endereco) delete (payload as any).endereco;
            if (!payload.telefone_estabelecimento) delete (payload as any).telefone_estabelecimento;

            if (isEditing) {
                // Remove password if not changing
                if (!form.senha) delete (payload as any).senha;
                await partnerService.update(initialData!.publicId, payload, token || undefined);
                toast({ title: "Parceiro atualizado com sucesso!" });
            } else {
                await partnerService.create(payload, token || undefined);
                toast({ title: "Parceiro criado com sucesso!" });
            }

            if (onSuccess) onSuccess();
        } catch (err: any) {
            toast({
                title: "Erro ao salvar",
                description: err.message || "Ocorreu um erro ao processar a solicitação.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <FormSection title="Dados Pessoais e Acesso">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CPF *</Label>
                        <Input
                            placeholder="000.000.000-00"
                            value={form.cpf}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-mono font-bold"
                            onChange={e => setForm(f => ({ ...f, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                            disabled={isEditing}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome Completo *</Label>
                        <Input
                            placeholder="Nome civil do dentista"
                            value={form.nome}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-medium"
                            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">E-mail de Acesso *</Label>
                        <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={form.email}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-medium"
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{isEditing ? 'Nova Senha' : 'Senha Provisória *'}</Label>
                        <Input
                            type="password"
                            placeholder={isEditing ? "(Opcional)" : "Mínimo 6 caracteres"}
                            value={form.senha}
                            className="h-11 border-primary/10 focus:border-primary transition-all"
                            onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Telefone de Contato</Label>
                        <Input
                            placeholder="(00) 00000-0000"
                            value={form.telefone}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-medium"
                            onChange={e => setForm(f => ({ ...f, telefone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection title="Registro Profissional">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Número do CRO *</Label>
                        <Input
                            placeholder="Ex: 12345"
                            value={form.cro}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-bold"
                            onChange={e => setForm(f => ({ ...f, cro: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">UF do CRO *</Label>
                        <select
                            className="flex h-11 w-full rounded-md border border-primary/10 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium"
                            value={form.croUf}
                            onChange={e => setForm(f => ({ ...f, croUf: e.target.value }))}
                        >
                            <option value="">Selecione...</option>
                            {ufs.map(uf => (
                                <option key={uf.id} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FormSection>

            <FormSection
                title="Qualificação e Especialidade"
                description="Selecione sua formação principal e outras áreas de atuação"
            >
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Titulação Máxima *</Label>
                        <RadioGroup
                            className="flex flex-wrap gap-4"
                            value={form.titulacaoId.toString()}
                            onValueChange={val => setForm(f => ({ ...f, titulacaoId: parseInt(val) }))}
                        >
                            {degrees.map(deg => (
                                <div key={deg.id} className="flex items-center space-x-3 bg-muted/10 px-4 py-2.5 rounded-full border border-border/40 hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                                    <RadioGroupItem value={deg.id.toString()} id={`deg-${deg.id}`} />
                                    <Label htmlFor={`deg-${deg.id}`} className="cursor-pointer text-xs font-bold uppercase tracking-tight">{deg.nome}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Especialidades</Label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {specialties.map(spec => (
                                <div key={spec.id} className="flex items-center space-x-3 bg-muted/10 p-3 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-muted/20 transition-all shadow-sm">
                                    <Checkbox
                                        id={`spec-${spec.id}`}
                                        checked={form.especialidadesIds.includes(spec.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setForm(f => ({ ...f, especialidadesIds: [...f.especialidadesIds, spec.id] }));
                                            } else {
                                                setForm(f => ({ ...f, especialidadesIds: f.especialidadesIds.filter(id => id !== spec.id) }));
                                            }
                                        }}
                                    />
                                    <Label htmlFor={`spec-${spec.id}`} className="cursor-pointer text-[10px] font-bold uppercase tracking-tighter leading-tight select-none">{spec.nome}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </FormSection>

            <FormSection title="Dados do Estabelecimento / Clínica">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Razão Social / Nome da Clínica</Label>
                        <Input
                            placeholder="Ex: Clínica Odontológica Sorriso"
                            value={form.razaoSocial}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-medium"
                            onChange={e => setForm(f => ({ ...f, razaoSocial: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CNPJ</Label>
                        <Input
                            placeholder="00.000.000/0000-00"
                            value={form.cnpj}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-mono"
                            onChange={e => setForm(f => ({ ...f, cnpj: e.target.value.replace(/\D/g, '').slice(0, 14) }))}
                        />
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Endereço Profissional</Label>
                        <Input
                            placeholder="Rua, número, sala..."
                            value={form.endereco}
                            className="h-11 border-primary/10 focus:border-primary transition-all"
                            onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bairro</Label>
                        <Input 
                            value={form.bairro}
                            className="h-11 border-primary/10 focus:border-primary transition-all"
                            onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CEP</Label>
                        <Input
                            placeholder="Apenas números"
                            value={form.cep}
                            className="h-11 border-primary/10 focus:border-primary transition-all font-mono"
                            onChange={e => setForm(f => ({ ...f, cep: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cidade</Label>
                        <Input 
                            value={form.cidade}
                            className="h-11 border-primary/10 focus:border-primary transition-all"
                            onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">UF</Label>
                        <select
                            className="flex h-11 w-full rounded-md border border-primary/10 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                            value={form.uf_estabelecimento}
                            onChange={e => setForm(f => ({ ...f, uf_estabelecimento: e.target.value }))}
                        >
                            <option value="">Selecione...</option>
                            {ufs.map(uf => (
                                <option key={uf.id} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FormSection>

            <FormSection
                title="Preferências de Comunicação"
                description="Selecione os canais para contato e notificações"
            >
                <div className="flex flex-wrap gap-4">
                    {commTypes.map(ct => (
                        <div key={ct.id} className="flex items-center space-x-3 bg-muted/10 px-5 py-3 rounded-full border border-border/40 hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                            <Checkbox
                                id={`comm-${ct.id}`}
                                checked={form.comunicacoesIds.includes(ct.id)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setForm(f => ({ ...f, comunicacoesIds: [...f.comunicacoesIds, ct.id] }));
                                    } else {
                                        setForm(f => ({ ...f, comunicacoesIds: f.comunicacoesIds.filter(id => id !== ct.id) }));
                                    }
                                }}
                            />
                            <Label htmlFor={`comm-${ct.id}`} className="cursor-pointer text-xs font-bold uppercase tracking-tight select-none">{ct.descricao}</Label>
                        </div>
                    ))}
                </div>
            </FormSection>

            <div className="flex justify-end gap-3 pt-10 border-t border-border mt-8">
                <Button variant="ghost" onClick={onCancel} disabled={loading} className="h-12 px-8 font-bold uppercase text-xs tracking-widest hover:bg-muted/30">Cancelar</Button>
                <Button onClick={handleSave} loading={loading} className="h-12 px-10 font-bold uppercase text-xs tracking-widest min-w-[200px] shadow-lg shadow-primary/20">
                    {isEditing ? "Salvar Alterações" : "Cadastrar Parceiro"}
                </Button>
            </div>
        </div>
    );
}

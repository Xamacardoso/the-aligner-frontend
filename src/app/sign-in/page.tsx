"use client";

import { useState } from "react";
import { useAppAuth } from "@/hooks/use-app-auth";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function SignInPage() {
    const [cpf, setCpf] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAppAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpf: cpf.replace(/\D/g, ''), senha: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erro ao realizar login");
            }

            login(data.access_token, data.user);
            
            toast({
                title: "Login realizado",
                description: `Bem-vindo, ${data.user.nome}!`,
            });

            // Redirecionar baseado no role
            if (data.user.role === 'gerente') {
                router.push("/gerente/dentistas");
            } else {
                router.push("/dentista/pacientes");
            }
        } catch (error: any) {
            toast({
                title: "Erro no login",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0">
                            <Image src="/thealign_logo2.jpeg" alt="The Aligner" fill className="object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">TheAligner</h1>
                    </div>
                </div>

                <Card className="shadow-xl border-none">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Acesse sua conta</CardTitle>
                        <CardDescription className="text-center">
                            Entre com seu CPF e senha para continuar
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input 
                                    id="cpf" 
                                    placeholder="000.000.000-00" 
                                    value={cpf}
                                    onChange={(e) => setCpf(e.target.value)}
                                    required 
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Senha</Label>
                                    <a href="#" className="text-sm text-blue-600 hover:underline">Esqueceu a senha?</a>
                                </div>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                    className="h-11"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col">
                            <Button 
                                type="submit" 
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                                disabled={isLoading}
                            >
                                {isLoading ? "Entrando..." : "Entrar"}
                            </Button>
                            <p className="mt-4 text-center text-sm text-slate-600">
                                Não tem uma conta?{" "}
                                <a href="#" className="font-medium text-blue-600 hover:underline">Fale com o gerente</a>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

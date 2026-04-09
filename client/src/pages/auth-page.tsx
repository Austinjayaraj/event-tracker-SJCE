import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { GraduationCap, User, Shield, Sparkles, Lock, Eye, EyeOff, CreditCard, LogIn } from "lucide-react";
import { Redirect } from "wouter";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [studentAuthMode, setStudentAuthMode] = useState("login");
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
      studentId: "",
      department: "",
      section: "",
      role: "student",
    },
  });

  if (user) {
    return <Redirect to={user.role === "admin" ? "/admin" : "/student"} />;
  }

  const handleLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterForm) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden text-white font-sans bg-transparent">
      {/* Global Header */}
      <div className="z-10 w-full pt-8 px-8 flex items-center gap-4">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center relative shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <span className="text-red-700 font-bold text-[10px] p-2 text-center leading-none">ST. JOSEPH'S</span>
        </div>
        <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wider text-purple-200">ST. JOSEPH'S COLLEGE OF ENGINEERING</h1>
            <p className="text-xs md:text-sm text-gray-400">Chennai - 600 119 | Autonomous Institution</p>
        </div>
      </div>
      
      {/* Divider */}
      <div className="w-[95%] max-w-7xl h-[1px] bg-white/10 z-10 mt-6 mb-10 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px] mx-4 z-10 flex-1 flex flex-col justify-center pb-20"
      >
        <Card className="glass border border-white/5 rounded-[30px] shadow-[0_8px_32px_rgba(0,0,0,0.8)] relative overflow-hidden bg-[#11131A]/80 pt-4">
          <CardHeader className="text-center pb-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(56,189,248,0.4)] relative"
            >
              <div className="absolute inset-1 bg-[#11131A] rounded-full flex items-center justify-center">
                 <GraduationCap className="text-cyan-400 w-10 h-10 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wide mb-2">
              Event Tracker
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              QR Code Based Attendance Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full bg-[#0A0B0E]/80 rounded-full mb-8 p-1 border border-white/5 shadow-inner">
                <TabsTrigger 
                    value="student" 
                    className={`flex-1 rounded-full text-sm font-medium py-2.5 transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'student' ? 'bg-gradient-to-r from-teal-400/90 to-purple-500/90 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                >
                  <User className="w-4 h-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger 
                    value="admin" 
                    className={`flex-1 rounded-full text-sm font-medium py-2.5 transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'admin' ? 'bg-gradient-to-r from-teal-400/90 to-purple-500/90 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                  <div className="space-y-2 relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-emerald-400 group-focus-within:text-emerald-300 transition-colors">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <Input
                      id="admin-username"
                      {...loginForm.register("username")}
                      placeholder="Login ID"
                      className="pl-12 py-6 rounded-2xl bg-[#0A0B0E] border-white/5 text-gray-200 placeholder:text-gray-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all font-medium"
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-xs text-red-500 pl-2">{loginForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-emerald-400 group-focus-within:text-emerald-300 transition-colors">
                        <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      {...loginForm.register("password")}
                      placeholder="Password"
                      className="pl-12 pr-12 py-6 rounded-2xl bg-[#0A0B0E] border-white/5 text-gray-200 placeholder:text-gray-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all font-medium"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-emerald-500/60 hover:text-emerald-400 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-red-500 pl-2">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-6 mt-4 rounded-full bg-gradient-to-r from-teal-400 to-purple-500 hover:from-teal-300 hover:to-purple-400 transition-all duration-300 text-white font-semibold text-base shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] border border-white/10"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Authenticating..." : <><LogIn className="w-5 h-5 mr-2" /> Login to Admin Portal</>}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student">
                <Tabs value={studentAuthMode} onValueChange={setStudentAuthMode} className="w-full">
                  <TabsList className="hidden">
                     <TabsTrigger value="login">Login</TabsTrigger>
                     <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                      <div className="space-y-2 relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-emerald-400 group-focus-within:text-emerald-300 transition-colors">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <Input
                          id="student-username"
                          {...loginForm.register("username")}
                          placeholder="Student ID (e.g. 24cs118)"
                          className="pl-12 py-6 rounded-2xl bg-[#0A0B0E] border-white/5 text-gray-200 placeholder:text-gray-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all font-medium tracking-wider"
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-xs text-red-500 pl-2">{loginForm.formState.errors.username.message}</p>
                        )}
                      </div>
                      <div className="space-y-2 relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-emerald-400 group-focus-within:text-emerald-300 transition-colors">
                            <Lock className="w-5 h-5" />
                        </div>
                        <Input
                          id="student-password"
                          type={showPassword ? "text" : "password"}
                          {...loginForm.register("password")}
                          placeholder="Password"
                          className="pl-12 pr-12 py-6 rounded-2xl bg-[#0A0B0E] border-white/5 text-gray-200 placeholder:text-gray-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all font-medium"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-4 flex items-center text-emerald-500/60 hover:text-emerald-400 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        {loginForm.formState.errors.password && (
                          <p className="text-xs text-red-500 pl-2">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full py-6 mt-4 rounded-full bg-gradient-to-r from-teal-400 to-purple-500 hover:from-teal-300 hover:to-purple-400 transition-all duration-300 text-white font-semibold text-base shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] border border-white/10"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Authenticating..." : <><LogIn className="w-5 h-5 mr-2" /> Login to Student Portal</>}
                      </Button>
                      
                      <div className="pt-4 text-center text-sm text-gray-500">
                        New student? <button type="button" onClick={() => setStudentAuthMode('register')} className="text-teal-400 font-medium hover:text-teal-300 transition-colors">Create Account</button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 relative">
                          <Input
                            id="name"
                            {...registerForm.register("name")}
                            placeholder="Full Name"
                            className="rounded-xl bg-[#0A0B0E] border-white/5 text-gray-200 text-sm py-5"
                          />
                        </div>
                        <div className="space-y-1 relative">
                          <Input
                            id="studentId"
                            {...registerForm.register("studentId")}
                            placeholder="Student ID"
                            className="rounded-xl bg-[#0A0B0E] border-white/5 text-gray-200 text-sm py-5"
                          />
                        </div>
                      </div>
                      <Input
                        id="register-username"
                        {...registerForm.register("username")}
                        placeholder="Choose a username"
                        className="rounded-xl bg-[#0A0B0E] border-white/5 text-gray-200 text-sm py-5"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Select onValueChange={(value) => registerForm.setValue("department", value)}>
                          <SelectTrigger className="rounded-xl bg-[#0A0B0E] border-white/5 text-gray-200 py-5">
                            <SelectValue placeholder="Department" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#11131A] border-white/5 text-gray-200">
                            {["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "BIO TECH", "ADS", "AML", "CYBER", "EIE", "CHEM", "MBA", "ME"].map(d => (
                              <SelectItem key={d} value={d} className="focus:bg-white/10 focus:text-white cursor-pointer">{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select onValueChange={(value) => registerForm.setValue("section", value)}>
                          <SelectTrigger className="rounded-xl bg-[#0A0B0E] border-white/5 text-gray-200 py-5">
                            <SelectValue placeholder="Section" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#11131A] border-white/5 text-gray-200">
                            {["A", "B", "C", "D", "E"].map(s => (
                              <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white cursor-pointer">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        id="email"
                        type="email"
                        {...registerForm.register("email")}
                        placeholder="student@sjce.ac.in"
                        className="rounded-xl bg-[#0A0B0E] border-white/5 text-gray-200 text-sm py-5"
                      />
                      <Input
                        id="register-password"
                        type="password"
                        {...registerForm.register("password")}
                        placeholder="Create password"
                        className="rounded-xl bg-[#0A0B0E] border-white/5 text-gray-200 text-sm py-5"
                      />
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...registerForm.register("confirmPassword")}
                        placeholder="Confirm password"
                        className="rounded-xl bg-[#0A0B0E] border-white/5 text-gray-200 text-sm py-5"
                      />
                      <Button
                        type="submit"
                        className="w-full py-6 mt-2 rounded-full bg-gradient-to-r from-teal-400 to-purple-500 hover:from-teal-300 hover:to-purple-400 transition-all duration-300 text-white font-semibold shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-white/10"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating..." : <><Sparkles className="w-4 h-4 mr-2" /> Create Account</>}
                      </Button>
                      
                      <div className="pt-2 text-center text-sm text-gray-500">
                        Already have an account? <button type="button" onClick={() => setStudentAuthMode('login')} className="text-purple-400 font-medium hover:text-purple-300 transition-colors">Login</button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

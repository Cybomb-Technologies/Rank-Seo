"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Metatags from "../../SEO/metatags";
import {
  Edit2,
  Save,
  Upload,
  MapPin,
  Briefcase,
  Calendar,
  Globe,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
} from "@/components/Utils/alert-util";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const UserOverview = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePicture: "",
    title: "",
    location: "",
    department: "",
    joinDate: "",
    bio: "",
    skills: [],
    website: "",
    provider: "local",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the URL contains a token from a social login redirect
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    // If a token is found in the URL, save it to localStorage and clean the URL
    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      router.replace("/profile");
    }

    const fetchProfile = async () => {
      // Get the token from local storage (either a newly saved one or an existing one)
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        setUserData({
          ...userData,
          name: data.name || "N/A",
          email: data.email || "N/A",
          phone: data.phone || "N/A",
          profilePicture: data.profilePicture || "/profile-pic.jpg",
          provider: data.provider || "local",
        });
      } catch (error) {
        console.error("Authentication failed:", error);
        localStorage.removeItem("token");
        router.push("/login");
      }
    };
    fetchProfile();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSave = () => {
    console.log("User Data Saved:", userData);
    setIsEditing(false);
    showSuccessAlert("Changes saved successfully!");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData({
          ...userData,
          profilePicture: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const metaPropsData = {
    title: "Profile Settings | Manage Your SEO Account",
    description:
      "Update your profile information, manage account settings, and customize your RANK SEO experience for better SEO tool management.",
    keyword:
      "SEO profile settings, account management, user profile, personal information, SEO account",
    url: "https://rankseo.in/profile",
    image: "https://rankseo.in/SEO_LOGO.png",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your personal and professional information
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-md border-0 rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-5">
                      <Avatar className="w-36 h-36">
                        <AvatarImage
                          src={userData.profilePicture}
                          alt={userData.name}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-5xl font-semibold">
                          {userData.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <label className="absolute bottom-2 right-2 bg-emerald-600 p-2 rounded-full cursor-pointer shadow-md hover:bg-emerald-700 transition-colors">
                          <Upload className="h-4 w-4 text-white" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 text-center">
                      {userData.name}
                    </h2>
                    <p className="text-gray-600 mt-1 text-center">
                      {userData.title}
                    </p>
                    {/* <div className="flex items-center mt-2 text-gray-500">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="text-sm truncate">{userData.location}</span>
                  </div> */}
                    <Link href="/forgotpassword">Change password</Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-2">
              <Card className="shadow-md border-0 rounded-xl overflow-hidden">
                <CardHeader className="border-b border-gray-200 bg-gray-50 py-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Profile Information
                    </CardTitle>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          className="border-gray-300"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleEdit}
                        variant="outline"
                        className="border-gray-300"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="w-full justify-start border-b border-gray-200 rounded-none px-6 bg-white">
                      <TabsTrigger
                        value="profile"
                        className="py-4 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none"
                      >
                        Personal Info
                      </TabsTrigger>

                      {/* {userData.provider === "local" && (
                      <TabsTrigger
                        value="security"
                        className="py-4 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none"
                      >
                        Security
                      </TabsTrigger>
                    )} */}
                    </TabsList>

                    <TabsContent value="profile" className="p-6 m-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Full Name
                          </label>
                          <Input
                            type="text"
                            name="name"
                            value={userData.name}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full border-gray-300 focus:border-emerald-400 disabled:bg-gray-100 disabled:text-gray-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            name="email"
                            value={userData.email}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full border-gray-300 focus:border-emerald-400 disabled:bg-gray-100 disabled:text-gray-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          <Input
                            type="text"
                            name="phone"
                            value={userData.phone}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full border-gray-300 focus:border-emerald-400 disabled:bg-gray-100 disabled:text-gray-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Website
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="text"
                              name="website"
                              value={userData.website}
                              onChange={handleChange}
                              disabled={!isEditing}
                              className="w-full border-gray-300 pl-10 focus:border-emerald-400 disabled:bg-gray-100 disabled:text-gray-600"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Bio
                          </label>
                          <textarea
                            name="bio"
                            value={userData.bio}
                            onChange={handleChange}
                            disabled={!isEditing}
                            rows={4}
                            className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 disabled:bg-gray-100 disabled:text-gray-600"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* <TabsContent value="security" className="p-6 m-0">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                          <Lock className="h-5 w-5 mr-2 text-emerald-600" />
                          Change Password
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Current Password</label>
                            <div className="relative">
                              <Input
                                type={showCurrentPassword ? "text" : "password"}
                                disabled={!isEditing}
                                className="w-full border-gray-300 focus:border-emerald-400 disabled:bg-gray-100 disabled:text-gray-600 pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div></div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative">
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                disabled={!isEditing}
                                className="w-full border-gray-300 focus:border-emerald-400 disabled:bg-gray-100 disabled:text-gray-600 pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                disabled={!isEditing}
                                className="w-full border-gray-300 focus:border-emerald-400 disabled:bg-gray-100 disabled:text-gray-600 pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>


                    </div>
                  </TabsContent> */}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserOverview;

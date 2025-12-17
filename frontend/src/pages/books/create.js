// import React, { useEffect, useRef, useState } from 'react';
// import { ChevronLeft, Book, Tag, Globe, DollarSign, Image as ImageIcon, FileText, Plus } from 'lucide-react';
// import Button from '@/components/Button'
// import Input from '@/components/Input'
// import Layout from '@/layout/Layout'
// import Uploader from '@/modules/Uploader'
// import { getAllAuthors } from '@/services/APIs/author'
// import { addBook } from '@/services/APIs/books'
// import { isRequired } from '@/Utilities/helpers'
// import Image from 'next/image'
// import { useRouter } from 'next/router'
// import { categories } from '@/Utilities/positions'
// import Select from 'react-select';

// export default function Create({ role, user }) {
//     const fileRef = useRef(null);
//     const [authors, setAuthors] = useState();
//     const [loading, setLoading] = useState(false);
//     const [bindingType, setBindingType] = useState(0);
//     const [cover, setCover] = useState(null);
//     const router = useRouter();
//     const formRef = useRef(null);

//     const fetchAuthors = async () => {
//         setLoading(true);
//         const paylaod = {
//             page: 1,
//             limit: 100,
//             role: "author"
//         }
//         const response = await getAllAuthors(paylaod)
//         if (response.status) {
//             setAuthors(response.data.results);
//             setLoading(false);
//         } else {
//             setLoading(false)
//         }
//     }

//     const handleCover = (val) => {
//         console.log(val)
//         setCover(val);
//     }

//     const saveBookDetails = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         const payload = new FormData();
//         const formData = new FormData(e.target);
//         const title = formData.get("title");
//         const subtitle = formData.get("sub-title");
//         const description = formData.get("description");
//         const isbn = formData.get("isbn");
//         let author;
//         if (role != "author") {
//             author = formData.get("author");
//         }
//         else {
//             author = user._id;
//         }
//         const category = formData.get("category");
//         const language = formData.get("language");
//         const price = formData.get("price");

//         const platforms = [];

//         if (bindingType == 0) {
//             payload.append("bindingSize[0]", "paperBack");
//             if (document.getElementById("dreambookpublication").checked) {
//                 const royalty = document.getElementById("dreambookpublicationvalue").value;
//                 platforms.push({
//                     "platform": "dream",
//                     "royalty": parseInt(royalty)
//                 })
//             }

//             if (document.getElementById("amazonpublication").checked) {
//                 const royalty = document.getElementById("amazonpublicationvalue").value;
//                 platforms.push({
//                     "platform": "amazon",
//                     "royalty": parseInt(royalty)
//                 })
//             }

//             payload.append("platforms", JSON.stringify(platforms));
//         }
//         else if (bindingType == 1) {
//             payload.append("bindingSize[0]", "hardCover");
//             if (document.getElementById("dreambookpublication").checked) {
//                 const royalty = document.getElementById("dreambookpublicationvalue").value;
//                 platforms.push({
//                     "platform": "dream",
//                     "royalty": parseInt(royalty)
//                 })
//             }

//             if (document.getElementById("amazonpublication").checked) {
//                 const royalty = document.getElementById("amazonpublicationvalue").value;
//                 platforms.push({
//                     "platform": "amazon",
//                     "royalty": parseInt(royalty)
//                 })
//             }

//             payload.append("platforms", JSON.stringify(platforms));
//         }
//         else {
//             payload.append("bindingSize[0]", "ebook");
//             const royalty = document.getElementById("kindle-royalty").value;
//             platforms.push({
//                 "platform": "kindle",
//                 "royalty": parseInt(royalty)
//             })
//             payload.append("platforms", JSON.stringify(platforms));
//         }

//         console.log(author)
//         if (isRequired(title, "Title") && isRequired(description, "Description") && isRequired(isbn, "ISBN") && isRequired(author, "Author") && isRequired(price, "Price")) {
//             payload.append("title", title);
//             payload.append("author", author);
//             payload.append("description", description);
//             payload.append("language", language);
//             payload.append("isbnNumber", isbn);
//             payload.append("price", price);
//             payload.append("subtitle", subtitle);
//             payload.append("coverImage", cover);
//             payload.append("categories[0]", category);

//             // ✅ LOGIC UPDATE: Force pending status for authors, approved for admins
//             if (role === "author") {
//                 payload.append("status", "pending");
//             } else {
//                 payload.append("status", "approved");
//             }

//             const response = await addBook(payload);
//             if (response.status) {
//                 setLoading(false);
//                 router.push("/books");
//             }
//         }
//         else {
//             setLoading(false)
//         }
//     }

//     useEffect(() => {
//         if (role != "author") {
//             fetchAuthors();
//         }
//     }, [])

//     return (
//         <Layout role={role}>
//             <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
//                 <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 mt-16 lg:mt-0'>
//                     {/* Header Section */}
//                     <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8'>
//                         <Button
//                             variant="white-border"
//                             className="w-fit shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 hover:text-blue-600"
//                             onClick={() => router.push("/books")}
//                         >
//                             <ChevronLeft className="w-4 h-4 mr-2" />
//                             Back
//                         </Button>
//                         <div>
//                             <h1 className='text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2'>
//                                 Create New Book
//                             </h1>
//                             <p className='text-gray-600'>Add your book details and publishing information</p>
//                         </div>
//                     </div>

//                     {/* Loading State */}
//                     {loading && (
//                         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                             <div className="bg-white rounded-2xl p-8 flex items-center gap-4 shadow-2xl">
//                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                                 <span className="text-lg font-medium text-gray-800">
//                                     {role === "author" ? "Submitting for review..." : "Creating book..."}
//                                 </span>
//                             </div>
//                         </div>
//                     )}

//                     {/* Main Form */}
//                     <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
//                         <form onSubmit={saveBookDetails} ref={formRef} className='p-6 lg:p-10 space-y-10'>

//                             {/* Basic Information Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-blue-100 rounded-xl">
//                                         <Book className="w-6 h-6 text-blue-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
//                                 </div>

//                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Book Title <span className='text-red-500'>*</span>
//                                         </label>
//                                         <Input
//                                             type="text"
//                                             placeholder="Enter book title"
//                                             name="title"
//                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                         />
//                                     </div>

//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Book Subtitle <span className='text-gray-400'>(Optional)</span>
//                                         </label>
//                                         <Input
//                                             type="text"
//                                             placeholder="Enter book subtitle"
//                                             name="sub-title"
//                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                         />
//                                     </div>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Book Short Description <span className='text-red-500'>*</span>
//                                     </label>
//                                     <textarea
//                                         rows="5"
//                                         placeholder="Enter short description"
//                                         name="description"
//                                         className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 transition-all duration-200 resize-none'
//                                     />
//                                 </div>

//                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             ISBN Number <span className='text-red-500'>*</span>
//                                         </label>
//                                         <Input
//                                             type="text"
//                                             name="isbn"
//                                             placeholder="Enter book ISBN number"
//                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                         />
//                                     </div>

//                                     {role !== "author" && (
//                                         <div className='space-y-2'>
//                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                 Book Author <span className='text-red-500'>*</span>
//                                             </label>
//                                             <div className="relative">
//                                                 <Select
//                                                     name="author"
//                                                     options={
//                                                         authors
//                                                             ? authors.map((author) => ({
//                                                                 value: author._id,
//                                                                 label: author.name,
//                                                             }))
//                                                             : []
//                                                     }
//                                                     classNamePrefix="react-select"
//                                                     placeholder="Search and select an author"
//                                                     isSearchable
//                                                     styles={{
//                                                         control: (provided) => ({
//                                                             ...provided,
//                                                             backgroundColor: 'white',
//                                                             borderRadius: '0.75rem',
//                                                             borderColor: '#E5E7EB',
//                                                             borderWidth: '2px',
//                                                             minHeight: '48px',
//                                                             paddingLeft: '0.5rem',
//                                                             fontSize: '0.875rem',
//                                                             fontWeight: '400',
//                                                             boxShadow: 'none',
//                                                             '&:hover': {
//                                                                 borderColor: '#D1D5DB'
//                                                             }
//                                                         }),
//                                                         input: (provided) => ({
//                                                             ...provided,
//                                                             color: '#1F2937',
//                                                         }),
//                                                         placeholder: (provided) => ({
//                                                             ...provided,
//                                                             color: '#9CA3AF',
//                                                         }),
//                                                     }}
//                                                 />
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Category and Language Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-purple-100 rounded-xl">
//                                         <Tag className="w-6 h-6 text-purple-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Category & Details</h2>
//                                 </div>

//                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Book Category <span className='text-red-500'>*</span>
//                                         </label>
//                                         <select
//                                             name="category"
//                                             defaultValue="Poetry"
//                                             className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 transition-all duration-200'
//                                         >
//                                             {categories.map((item, index) => (
//                                                 <option key={`category-${index}`} value={item.value}>
//                                                     {item.value}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     </div>

//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Language <span className='text-red-500'>*</span>
//                                         </label>
//                                         <select
//                                             name='language'
//                                             defaultValue="English"
//                                             className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 transition-all duration-200'
//                                         >
//                                             <option value="English">English</option>
//                                             <option value="Hindi">Hindi</option>
//                                             <option value="Telugu">Others</option>
//                                         </select>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Cover Upload Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-green-100 rounded-xl">
//                                         <ImageIcon className="w-6 h-6 text-green-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Book Cover</h2>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Upload Cover File <span className='text-red-500'>*</span>
//                                         <span className='text-gray-500 font-normal'> (max size 1mb in JPEG or PNG format only)</span>
//                                     </label>
//                                     <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-all duration-200">
//                                         <Uploader handler={handleCover} title="Upload Book Cover" />
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Pricing Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-yellow-100 rounded-xl">
//                                         <DollarSign className="w-6 h-6 text-yellow-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Book Price <span className='text-red-500'>*</span>
//                                     </label>
//                                     <Input
//                                         type="number"
//                                         name="price"
//                                         placeholder="₹299"
//                                         onWheel={(e) => e.target.blur()}
//                                         className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl max-w-xs"
//                                     />
//                                 </div>
//                             </div>

//                             {/* Binding Type Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-indigo-100 rounded-xl">
//                                         <FileText className="w-6 h-6 text-indigo-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Binding Type</h2>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Choose Binding Size <span className='text-red-500'>*</span>
//                                     </label>
//                                     <div className='bg-white border-2 border-gray-200 rounded-xl p-6'>
//                                         <div className='flex flex-wrap gap-8'>
//                                             <label className='flex items-center cursor-pointer group'>
//                                                 <input
//                                                     type='radio'
//                                                     className='w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3'
//                                                     id="paperback-checkbox"
//                                                     name="book-binding"
//                                                     defaultChecked={true}
//                                                     onChange={() => setBindingType(0)}
//                                                 />
//                                                 <span className='text-gray-700 font-medium group-hover:text-blue-600 transition-colors'>Paper Back</span>
//                                             </label>

//                                             <label className='flex items-center cursor-pointer group'>
//                                                 <input
//                                                     type='radio'
//                                                     className='w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3'
//                                                     id="hardcover-checkbox"
//                                                     name="book-binding"
//                                                     onChange={() => setBindingType(1)}
//                                                 />
//                                                 <span className='text-gray-700 font-medium group-hover:text-blue-600 transition-colors'>Hard Cover</span>
//                                             </label>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Publication Platforms Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-red-100 rounded-xl">
//                                         <Globe className="w-6 h-6 text-red-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Publication Platforms</h2>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Choose Publication <span className='text-red-500'>*</span>
//                                     </label>

//                                     <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
//                                         {bindingType == 0 || bindingType == 1 ? (
//                                             <>
//                                                 <div className='bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300'>
//                                                     <div className='p-6'>
//                                                         <label className='flex items-center cursor-pointer mb-4'>
//                                                             <input
//                                                                 type='checkbox'
//                                                                 id="dreambookpublication"
//                                                                 className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                             />
//                                                             <Image alt="dream-logo" src='/images/dream-book-logo.png' width={126} height={56} className="object-contain" />
//                                                         </label>
//                                                         <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                                 Royalty <span className='text-red-500'>*</span>
//                                                             </label>
//                                                             <Input
//                                                                 type="number"
//                                                                 id="dreambookpublicationvalue"
//                                                                 placeholder="₹50"
//                                                                 className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                 </div>

//                                                 <div className='bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300'>
//                                                     <div className='p-6'>
//                                                         <label className='flex items-center cursor-pointer mb-4'>
//                                                             <input
//                                                                 type='checkbox'
//                                                                 id="amazonpublication"
//                                                                 className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                             />
//                                                             <img src='/images/dream-big.png' width={126} height={56} className="object-contain" />
//                                                         </label>
//                                                         <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                                 Royalty <span className='text-red-500'>*</span>
//                                                             </label>
//                                                             <Input
//                                                                 type="number"
//                                                                 placeholder="₹50"
//                                                                 id="amazonpublicationvalue"
//                                                                 className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </>
//                                         ) : (
//                                             <div className='bg-white rounded-2xl border-2 border-blue-500 shadow-lg md:col-span-2 lg:col-span-1'>
//                                                 <div className='p-6'>
//                                                     <div className='flex items-center cursor-pointer mb-4'>
//                                                         <img src='/images/kindle.png' className='object-contain' width={126} height={56} />
//                                                     </div>
//                                                     <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                                             Royalty <span className='text-red-500'>*</span>
//                                                         </label>
//                                                         <Input
//                                                             type="number"
//                                                             id="kindle-royalty"
//                                                             placeholder="₹50"
//                                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                         />
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Submit Button */}
//                             <div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t-2 border-gray-100'>
//                                 <div className="text-sm text-gray-600">
//                                     <p>All fields marked with <span className="text-red-500">*</span> are required</p>
//                                 </div>
//                                 <Button
//                                     type="submit"
//                                     variant="primary"
//                                     className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
//                                     disabled={loading}
//                                 >
//                                     {loading ? (
//                                         <>
//                                             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                                             {role === "author" ? "Submitting..." : "Creating..."}
//                                         </>
//                                     ) : (
//                                         <>
//                                             <Plus className="w-5 h-5 mr-2" />
//                                             {role === "author" ? "Save & Send for Review" : "Publish Book"}
//                                         </>
//                                     )}
//                                 </Button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             </div>
//         </Layout>
//     )
// }

// export async function getServerSideProps({ req, res }) {
//     const role = req.cookies._r || null;
//     const user = req.cookies.user || null;
//     return {
//         props: {
//             role: role,
//             user: await JSON.parse(user)
//         },
//     };
// }
// 2nd v
// import React, { useEffect, useRef, useState } from 'react';
// import { ChevronLeft, Book, Tag, Globe, DollarSign, Image as ImageIcon, FileText, Plus } from 'lucide-react';
// import Button from '@/components/Button'
// import Input from '@/components/Input'
// import Layout from '@/layout/Layout'
// import Uploader from '@/modules/Uploader'
// import { getAllAuthors } from '@/services/APIs/author'
// import { addBook } from '@/services/APIs/books'
// import { isRequired } from '@/Utilities/helpers'
// import Image from 'next/image'
// import { useRouter } from 'next/router'
// import { categories } from '@/Utilities/positions'
// import Select from 'react-select';

// export default function Create({ role, user }) {
//     const fileRef = useRef(null);
//     const [authors, setAuthors] = useState();
//     const [loading, setLoading] = useState(false);
//     const [bindingType, setBindingType] = useState(0);
//     const [cover, setCover] = useState(null);
//     const router = useRouter();
//     const formRef = useRef(null);

//     const fetchAuthors = async () => {
//         setLoading(true);
//         const paylaod = {
//             page: 1,
//             limit: 100,
//             role: "author"
//         }
//         const response = await getAllAuthors(paylaod)
//         if (response.status) {
//             setAuthors(response.data.results);
//             setLoading(false);
//         } else {
//             setLoading(false)
//         }
//     }

//     const handleCover = (val) => {
//         console.log(val)
//         setCover(val);
//     }

//     const saveBookDetails = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         const payload = new FormData();
//         const formData = new FormData(e.target);
//         const title = formData.get("title");
//         const subtitle = formData.get("sub-title");
//         const description = formData.get("description");
//         const isbn = formData.get("isbn");
//         let author;

//         // Determine Author ID
//         if (role !== "author" && role !== "employee") { // Admin selects author
//             author = formData.get("author");
//         } else { // Author or Employee uses their own ID
//             author = user._id;
//         }
        
//         const category = formData.get("category");
//         const language = formData.get("language");
//         const price = formData.get("price");

//         const platforms = [];
        
//         if (bindingType === 0) { // Paper Back
//             payload.append("bindingSize[0]", "paperBack");
//         } else if (bindingType === 1) { // Hard Cover
//             payload.append("bindingSize[0]", "hardCover");
//         } else { // Ebook
//             payload.append("bindingSize[0]", "ebook");
//         }

//         // Check for Physical Platforms (Paper Back / Hard Cover)
//         if (bindingType === 0 || bindingType === 1) {
//             if (document.getElementById("dreambookpublication")?.checked) {
//                 const royalty = document.getElementById("dreambookpublicationvalue").value;
//                 platforms.push({
//                     "platform": "dream", // Using 'dream' as per your original logic
//                     "royalty": parseInt(royalty || 0)
//                 })
//             }

//             if (document.getElementById("amazonpublication")?.checked) {
//                 const royalty = document.getElementById("amazonpublicationvalue").value;
//                 platforms.push({
//                     "platform": "amazon",
//                     "royalty": parseInt(royalty || 0)
//                 })
//             }

//             // ✅ ADDED: Flipkart Submission Logic
//             if (document.getElementById("flipkartpublication")?.checked) {
//                 const royalty = document.getElementById("flipkartpublicationvalue").value;
//                 platforms.push({
//                     "platform": "flipkart",
//                     "royalty": parseInt(royalty || 0)
//                 })
//             }
//         } else {
//              // Ebook/Kindle logic
//             const royalty = document.getElementById("kindle-royalty").value;
//             platforms.push({
//                 "platform": "kindle",
//                 "royalty": parseInt(royalty || 0)
//             })
//         }

//         payload.append("platforms", JSON.stringify(platforms));
        
//         console.log(author)
//         if (isRequired(title, "Title") && isRequired(description, "Description") && isRequired(isbn, "ISBN") && isRequired(author, "Author") && isRequired(price, "Price")) {
//             payload.append("title", title);
//             payload.append("author", author);
//             payload.append("description", description);
//             payload.append("language", language);
//             payload.append("isbnNumber", isbn);
//             payload.append("price", price);
//             payload.append("subtitle", subtitle);
//             payload.append("coverImage", cover);
//             payload.append("categories[0]", category);

//             // ✅ LOGIC UPDATE: Force pending status for authors/employees, approved for admins
//             if (role === "author" || role === "employee") {
//                 payload.append("status", "pending");
//             } else {
//                 payload.append("status", "approved");
//             }

//             const response = await addBook(payload);
//             if (response.status) {
//                 setLoading(false);
//                 router.push("/books");
//             }
//         }
//         else {
//             setLoading(false)
//         }
//     }

//     useEffect(() => {
//         if (role != "author") {
//             fetchAuthors();
//         }
//     }, [])

//     return (
//         <Layout role={role}>
//             <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
//                 <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 mt-16 lg:mt-0'>
//                     {/* Header Section */}
//                     <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8'>
//                         <Button
//                             variant="white-border"
//                             className="w-fit shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 hover:text-blue-600"
//                             onClick={() => router.push("/books")}
//                         >
//                             <ChevronLeft className="w-4 h-4 mr-2" />
//                             Back
//                         </Button>
//                         <div>
//                             <h1 className='text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2'>
//                                 Create New Book
//                             </h1>
//                             <p className='text-gray-600'>Add your book details and publishing information</p>
//                         </div>
//                     </div>

//                     {/* Loading State */}
//                     {loading && (
//                         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                             <div className="bg-white rounded-2xl p-8 flex items-center gap-4 shadow-2xl">
//                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                                 <span className="text-lg font-medium text-gray-800">
//                                     {role === "author" ? "Submitting for review..." : "Creating book..."}
//                                 </span>
//                             </div>
//                         </div>
//                     )}

//                     {/* Main Form */}
//                     <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
//                         <form onSubmit={saveBookDetails} ref={formRef} className='p-6 lg:p-10 space-y-10'>

//                             {/* Basic Information Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-blue-100 rounded-xl">
//                                         <Book className="w-6 h-6 text-blue-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
//                                 </div>

//                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Book Title <span className='text-red-500'>*</span>
//                                         </label>
//                                         <Input
//                                             type="text"
//                                             placeholder="Enter book title"
//                                             name="title"
//                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                         />
//                                     </div>

//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Book Subtitle <span className='text-gray-400'>(Optional)</span>
//                                         </label>
//                                         <Input
//                                             type="text"
//                                             placeholder="Enter book subtitle"
//                                             name="sub-title"
//                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                         />
//                                     </div>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Book Short Description <span className='text-red-500'>*</span>
//                                     </label>
//                                     <textarea
//                                         rows="5"
//                                         placeholder="Enter short description"
//                                         name="description"
//                                         className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 transition-all duration-200 resize-none'
//                                     />
//                                 </div>

//                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             ISBN Number <span className='text-red-500'>*</span>
//                                         </label>
//                                         <Input
//                                             type="text"
//                                             name="isbn"
//                                             placeholder="Enter book ISBN number"
//                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                         />
//                                     </div>

//                                     {role !== "author" && (
//                                         <div className='space-y-2'>
//                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                 Book Author <span className='text-red-500'>*</span>
//                                             </label>
//                                             <div className="relative">
//                                                 <Select
//                                                     name="author"
//                                                     options={
//                                                         authors
//                                                             ? authors.map((author) => ({
//                                                                 value: author._id,
//                                                                 label: author.name,
//                                                             }))
//                                                             : []
//                                                     }
//                                                     classNamePrefix="react-select"
//                                                     placeholder="Search and select an author"
//                                                     isSearchable
//                                                     styles={{
//                                                         control: (provided) => ({
//                                                             ...provided,
//                                                             backgroundColor: 'white',
//                                                             borderRadius: '0.75rem',
//                                                             borderColor: '#E5E7EB',
//                                                             borderWidth: '2px',
//                                                             minHeight: '48px',
//                                                             paddingLeft: '0.5rem',
//                                                             fontSize: '0.875rem',
//                                                             fontWeight: '400',
//                                                             boxShadow: 'none',
//                                                             '&:hover': {
//                                                                 borderColor: '#D1D5DB'
//                                                             }
//                                                         }),
//                                                         input: (provided) => ({
//                                                             ...provided,
//                                                             color: '#1F2937',
//                                                         }),
//                                                         placeholder: (provided) => ({
//                                                             ...provided,
//                                                             color: '#9CA3AF',
//                                                         }),
//                                                     }}
//                                                 />
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Category and Language Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-purple-100 rounded-xl">
//                                         <Tag className="w-6 h-6 text-purple-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Category & Details</h2>
//                                 </div>

//                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Book Category <span className='text-red-500'>*</span>
//                                         </label>
//                                         <select
//                                             name="category"
//                                             defaultValue="Poetry"
//                                             className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 transition-all duration-200'
//                                         >
//                                             {categories.map((item, index) => (
//                                                 <option key={`category-${index}`} value={item.value}>
//                                                     {item.value}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     </div>

//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Language <span className='text-red-500'>*</span>
//                                         </label>
//                                         <select
//                                             name='language'
//                                             defaultValue="English"
//                                             className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 transition-all duration-200'
//                                         >
//                                             <option value="English">English</option>
//                                             <option value="Hindi">Hindi</option>
//                                             <option value="Telugu">Others</option>
//                                         </select>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Cover Upload Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-green-100 rounded-xl">
//                                         <ImageIcon className="w-6 h-6 text-green-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Book Cover</h2>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Upload Cover File <span className='text-red-500'>*</span>
//                                         <span className='text-gray-500 font-normal'> (max size 1mb in JPEG or PNG format only)</span>
//                                     </label>
//                                     <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-all duration-200">
//                                         <Uploader handler={handleCover} title="Upload Book Cover" />
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Pricing Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-yellow-100 rounded-xl">
//                                         <DollarSign className="w-6 h-6 text-yellow-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Book Price <span className='text-red-500'>*</span>
//                                     </label>
//                                     <Input
//                                         type="number"
//                                         name="price"
//                                         placeholder="₹299"
//                                         onWheel={(e) => e.target.blur()}
//                                         className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl max-w-xs"
//                                     />
//                                 </div>
//                             </div>

//                             {/* Binding Type Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-indigo-100 rounded-xl">
//                                         <FileText className="w-6 h-6 text-indigo-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Binding Type</h2>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Choose Binding Size <span className='text-red-500'>*</span>
//                                     </label>
//                                     <div className='bg-white border-2 border-gray-200 rounded-xl p-6'>
//                                         <div className='flex flex-wrap gap-8'>
//                                             <label className='flex items-center cursor-pointer group'>
//                                                 <input
//                                                     type='radio'
//                                                     className='w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3'
//                                                     id="paperback-checkbox"
//                                                     name="book-binding"
//                                                     defaultChecked={true}
//                                                     onChange={() => setBindingType(0)}
//                                                 />
//                                                 <span className='text-gray-700 font-medium group-hover:text-blue-600 transition-colors'>Paper Back</span>
//                                             </label>

//                                             <label className='flex items-center cursor-pointer group'>
//                                                 <input
//                                                     type='radio'
//                                                     className='w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3'
//                                                     id="hardcover-checkbox"
//                                                     name="book-binding"
//                                                     onChange={() => setBindingType(1)}
//                                                 />
//                                                 <span className='text-gray-700 font-medium group-hover:text-blue-600 transition-colors'>Hard Cover</span>
//                                             </label>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Publication Platforms Section */}
//                             <div className="space-y-6">
//                                 <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                     <div className="p-2 bg-red-100 rounded-xl">
//                                         <Globe className="w-6 h-6 text-red-600" />
//                                     </div>
//                                     <h2 className="text-2xl font-bold text-gray-900">Publication Platforms</h2>
//                                 </div>

//                                 <div className='space-y-2'>
//                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                         Choose Publication <span className='text-red-500'>*</span>
//                                     </label>

//                                     <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
//                                         {bindingType == 0 || bindingType == 1 ? (
//                                             <>
//                                                 {/* DreamBook Publication (woocommerce/dream) - CORRECTED PATH & SIZE */}
//                                                 <div className='bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300'>
//                                                     <div className='p-6'>
//                                                         <label className='flex items-center cursor-pointer mb-4'>
//                                                             <input
//                                                                 type='checkbox'
//                                                                 id="dreambookpublication"
//                                                                 className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                             />
//                                                             <img alt="dream-logo" src='/images/app-icon.png' width={96} height={40} className="object-contain" />
//                                                         </label>
//                                                         <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                                 Royalty <span className='text-red-500'>*</span>
//                                                             </label>
//                                                             <Input
//                                                                 type="number"
//                                                                 id="dreambookpublicationvalue"
//                                                                 placeholder="₹50"
//                                                                 className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                 </div>

//                                                 {/* Amazon Publication - CORRECTED PATH & SIZE */}
//                                                 <div className='bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300'>
//                                                     <div className='p-6'>
//                                                         <label className='flex items-center cursor-pointer mb-4'>
//                                                             <input
//                                                                 type='checkbox'
//                                                                 id="amazonpublication"
//                                                                 className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                             />
//                                                             <img src='/images/amazon.png' alt="amazon" width={96} height={40} className="object-contain" />
//                                                         </label>
//                                                         <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                                 Royalty <span className='text-red-500'>*</span>
//                                                             </label>
//                                                             <Input
//                                                                 type="number"
//                                                                 placeholder="₹50"
//                                                                 id="amazonpublicationvalue"
//                                                                 className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                 </div>
                                                
//                                                 {/* ✅ ADDED: Flipkart Publication - CORRECTED SIZE */}
//                                                 <div className='bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300'>
//                                                     <div className='p-6'>
//                                                         <label className='flex items-center cursor-pointer mb-4'>
//                                                             <input
//                                                                 type='checkbox'
//                                                                 id="flipkartpublication"
//                                                                 className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                             />
//                                                             <img src='/images/flipkart.png' alt="flipkart" width={96} height={40} className="object-contain" />
//                                                         </label>
//                                                         <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                                 Royalty <span className='text-red-500'>*</span>
//                                                             </label>
//                                                             <Input
//                                                                 type="number"
//                                                                 placeholder="₹50"
//                                                                 id="flipkartpublicationvalue"
//                                                                 className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                 </div>
                                                
//                                             </>
//                                         ) : (
//                                             <div className='bg-white rounded-2xl border-2 border-blue-500 shadow-lg md:col-span-2 lg:col-span-1'>
//                                                 <div className='p-6'>
//                                                     <div className='flex items-center cursor-pointer mb-4'>
//                                                         <img src='/images/kindle.png' className='object-contain' width={126} height={56} />
//                                                     </div>
//                                                     <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                                             Royalty <span className='text-red-500'>*</span>
//                                                         </label>
//                                                         <Input
//                                                             type="number"
//                                                             id="kindle-royalty"
//                                                             placeholder="₹50"
//                                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                         />
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Submit Button */}
//                             <div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t-2 border-gray-100'>
//                                 <div className="text-sm text-gray-600">
//                                     <p>All fields marked with <span className="text-red-500">*</span> are required</p>
//                                 </div>
//                                 <Button
//                                     type="submit"
//                                     variant="primary"
//                                     className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
//                                     disabled={loading}
//                                 >
//                                     {loading ? (
//                                         <>
//                                             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                                             {role === "author" ? "Submitting..." : "Creating..."}
//                                         </>
//                                     ) : (
//                                         <>
//                                             <Plus className="w-5 h-5 mr-2" />
//                                             {role === "author" ? "Save & Send for Review" : "Publish Book"}
//                                         </>
//                                     )}
//                                 </Button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             </div>
//         </Layout>
//     )
// }

// export async function getServerSideProps({ req, res }) {
//     const role = req.cookies._r || null;
//     const user = req.cookies.user || null;
//     return {
//         props: {
//             role: role,
//             user: await JSON.parse(user)
//         },
//     };
// }

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Book, Tag, Globe, DollarSign, Image as ImageIcon, FileText, Plus } from 'lucide-react';
import Button from '@/components/Button'
import Input from '@/components/Input'
import Layout from '@/layout/Layout'
import Uploader from '@/modules/Uploader'
import { getAllAuthors } from '@/services/APIs/author'
import { addBook } from '@/services/APIs/books'
import { isRequired } from '@/Utilities/helpers'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { categories } from '@/Utilities/positions'
import Select from 'react-select';
// Note: Assuming `Uploader` is correctly imported from '@/modules/Uploader'

export default function Create({ role, user }) {
    const fileRef = useRef(null);
    const [authors, setAuthors] = useState();
    const [loading, setLoading] = useState(false);
    const [bindingType, setBindingType] = useState(0);
    const [cover, setCover] = useState(null); // <-- The file object state
    const router = useRouter();
    const formRef = useRef(null);

    const fetchAuthors = async () => {
        setLoading(true);
        const paylaod = {
            page: 1,
            limit: 100,
            role: "author"
        }
        try {
            const response = await getAllAuthors(paylaod)
            if (response.status) {
                setAuthors(response.data.results);
            }
        } catch(error) {
            console.error("Failed to fetch authors:", error);
        } finally {
             setLoading(false);
        }
    }

    const handleCover = (val) => {
        console.log("File received from Uploader:", val);
        setCover(val); // <-- Critical line: Sets the cover file object
    }

    const saveBookDetails = async (e) => {
        e.preventDefault();
        setLoading(true); 

        const payload = new FormData();
        const formData = new FormData(e.target);
        const title = formData.get("title");
        const subtitle = formData.get("sub-title");
        const description = formData.get("description");
        const isbn = formData.get("isbn");
        let author;

        // Determine Author ID
        if (role !== "author" && role !== "employee") { 
            author = formData.get("author");
        } else {
            author = user._id;
        }
        
        const category = formData.get("category");
        const language = formData.get("language");
        const price = formData.get("price");

        // 1. Check required fields first (and stop loading if check fails)
        // Ensure cover is also required for submission to prevent the missing file error
        if (!(isRequired(title, "Title") && isRequired(description, "Description") && isRequired(isbn, "ISBN") && isRequired(author, "Author") && isRequired(price, "Price") && cover)) {
            // Show a more specific error for the missing cover image
            if (!cover) {
                alert("Please upload the book cover image.");
            }
            setLoading(false); 
            return;
        }

        const platforms = [];
        
        // Setup binding size (PaperBack, HardCover, Ebook)
        if (bindingType === 0) { 
            payload.append("bindingSize[0]", "paperBack");
        } else if (bindingType === 1) { 
            payload.append("bindingSize[0]", "hardCover");
        } else {
            payload.append("bindingSize[0]", "ebook");
        }

        // Setup Platforms (DreamBook, Amazon, Flipkart, Kindle)
        if (bindingType === 0 || bindingType === 1) {
            if (document.getElementById("dreambookpublication")?.checked) {
                platforms.push({ "platform": "dream", "royalty": parseInt(document.getElementById("dreambookpublicationvalue").value || 0) });
            }
            if (document.getElementById("amazonpublication")?.checked) {
                platforms.push({ "platform": "amazon", "royalty": parseInt(document.getElementById("amazonpublicationvalue").value || 0) });
            }
            if (document.getElementById("flipkartpublication")?.checked) {
                platforms.push({ "platform": "flipkart", "royalty": parseInt(document.getElementById("flipkartpublicationvalue").value || 0) });
            }
        } else {
            // Ebook/Kindle logic
            platforms.push({ "platform": "kindle", "royalty": parseInt(document.getElementById("kindle-royalty").value || 0) });
        }
        payload.append("platforms", JSON.stringify(platforms));

        // Append basic data to payload
        payload.append("title", title);
        payload.append("author", author);
        payload.append("description", description);
        payload.append("language", language);
        payload.append("isbnNumber", isbn);
        payload.append("price", price);
        payload.append("subtitle", subtitle);
        payload.append("coverImage", cover); // <-- Critical line: Appends the file object
        payload.append("categories[0]", category);

        // Append status
        payload.append("status", (role === "author" || role === "employee") ? "pending" : "approved");
        
        // 2. Execute API Call inside try/catch/finally
        try {
            const response = await addBook(payload);
            if (response.status) {
                router.push("/books"); // Navigate on success
            } else {
                console.error("API failed:", response.message); 
                alert("Book submission failed: " + response.message);
            }
        } catch (error) {
            console.error("Error during book submission:", error);
            alert("An unknown error occurred during submission.");
        } finally {
            setLoading(false); // <-- FIX: ALWAYS stops loading
        }
    }

    useEffect(() => {
        if (role != "author") {
            fetchAuthors();
        }
    }, [])

    return (
        <Layout role={role}>
            <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 mt-16 lg:mt-0'>
                    {/* Header Section */}
                    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8'>
                        <Button
                            variant="white-border"
                            className="w-fit shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 hover:text-blue-600"
                            onClick={() => router.push("/books")}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className='text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2'>
                                Create New Book
                            </h1>
                            <p className='text-gray-600'>Add your book details and publishing information</p>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-2xl p-8 flex items-center gap-4 shadow-2xl">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="text-lg font-medium text-gray-800">
                                    {role === "author" ? "Submitting for review..." : "Creating book..."}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Main Form */}
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                        <form onSubmit={saveBookDetails} ref={formRef} className='p-6 lg:p-10 space-y-10'>

                            {/* Basic Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                                    <div className="p-2 bg-blue-100 rounded-xl">
                                        <Book className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className='space-y-2'>
                                        <label className='block text-gray-700 font-semibold text-sm'>
                                            Book Title <span className='text-red-500'>*</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Enter book title"
                                            name="title"
                                            className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                        />
                                    </div>

                                    <div className='space-y-2'>
                                        <label className='block text-gray-700 font-semibold text-sm'>
                                            Book Subtitle <span className='text-gray-400'>(Optional)</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Enter book subtitle"
                                            name="sub-title"
                                            className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <label className='block text-gray-700 font-semibold text-sm'>
                                        Book Short Description <span className='text-red-500'>*</span>
                                    </label>
                                    <textarea
                                        rows="5"
                                        placeholder="Enter short description"
                                        name="description"
                                        className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 transition-all duration-200 resize-none'
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className='space-y-2'>
                                        <label className='block text-gray-700 font-semibold text-sm'>
                                            ISBN Number <span className='text-red-500'>*</span>
                                        </label>
                                        <Input
                                            type="text"
                                            name="isbn"
                                            placeholder="Enter book ISBN number"
                                            className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                        />
                                    </div>

                                    {role !== "author" && (
                                        <div className='space-y-2'>
                                            <label className='block text-gray-700 font-semibold text-sm'>
                                                Book Author <span className='text-red-500'>*</span>
                                            </label>
                                            <div className="relative">
                                                <Select
                                                    name="author"
                                                    options={
                                                        authors
                                                            ? authors.map((author) => ({
                                                                value: author._id,
                                                                label: author.name,
                                                            }))
                                                            : []
                                                    }
                                                    classNamePrefix="react-select"
                                                    placeholder="Search and select an author"
                                                    isSearchable
                                                    styles={{
                                                        control: (provided) => ({
                                                            ...provided,
                                                            backgroundColor: 'white',
                                                            borderRadius: '0.75rem',
                                                            borderColor: '#E5E7EB',
                                                            borderWidth: '2px',
                                                            minHeight: '48px',
                                                            paddingLeft: '0.5rem',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '400',
                                                            boxShadow: 'none',
                                                            '&:hover': {
                                                                borderColor: '#D1D5DB'
                                                            }
                                                        }),
                                                        input: (provided) => ({
                                                            ...provided,
                                                            color: '#1F2937',
                                                        }),
                                                        placeholder: (provided) => ({
                                                            ...provided,
                                                            color: '#9CA3AF',
                                                        }),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Category and Language Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                                    <div className="p-2 bg-purple-100 rounded-xl">
                                        <Tag className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Category & Details</h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className='space-y-2'>
                                        <label className='block text-gray-700 font-semibold text-sm'>
                                            Book Category <span className='text-red-500'>*</span>
                                        </label>
                                        <select
                                            name="category"
                                            defaultValue="Poetry"
                                            className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 transition-all duration-200'
                                        >
                                            {categories.map((item, index) => (
                                                <option key={`category-${index}`} value={item.value}>
                                                    {item.value}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className='space-y-2'>
                                        <label className='block text-gray-700 font-semibold text-sm'>
                                            Language <span className='text-red-500'>*</span>
                                        </label>
                                        <select
                                            name='language'
                                            defaultValue="English"
                                            className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 transition-all duration-200'
                                        >
                                            <option value="English">English</option>
                                            <option value="Hindi">Hindi</option>
                                            <option value="Telugu">Others</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Cover Upload Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                                    <div className="p-2 bg-green-100 rounded-xl">
                                        <ImageIcon className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Book Cover</h2>
                                </div>

                                <div className='space-y-2'>
                                    <label className='block text-gray-700 font-semibold text-sm'>
                                        Upload Cover File <span className='text-red-500'>*</span>
                                        <span className='text-gray-500 font-normal'> (max size 1mb in JPEG or PNG format only)</span>
                                    </label>
                                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-all duration-200">
                                        <Uploader handler={handleCover} title="Upload Book Cover" />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                                    <div className="p-2 bg-yellow-100 rounded-xl">
                                        <DollarSign className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
                                </div>

                                <div className='space-y-2'>
                                    <label className='block text-gray-700 font-semibold text-sm'>
                                        Book Price <span className='text-red-500'>*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        name="price"
                                        placeholder="₹299"
                                        onWheel={(e) => e.target.blur()}
                                        className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl max-w-xs"
                                    />
                                </div>
                            </div>

                            {/* Binding Type Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                                    <div className="p-2 bg-indigo-100 rounded-xl">
                                        <FileText className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Binding Type</h2>
                                </div>

                                <div className='space-y-2'>
                                    <label className='block text-gray-700 font-semibold text-sm'>
                                        Choose Binding Size <span className='text-red-500'>*</span>
                                    </label>
                                    <div className='bg-white border-2 border-gray-200 rounded-xl p-6'>
                                        <div className='flex flex-wrap gap-8'>
                                            <label className='flex items-center cursor-pointer group'>
                                                <input
                                                    type='radio'
                                                    className='w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3'
                                                    id="paperback-checkbox"
                                                    name="book-binding"
                                                    defaultChecked={true}
                                                    onChange={() => setBindingType(0)}
                                                />
                                                <span className='text-gray-700 font-medium group-hover:text-blue-600 transition-colors'>Paper Back</span>
                                            </label>

                                            <label className='flex items-center cursor-pointer group'>
                                                <input
                                                    type='radio'
                                                    className='w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3'
                                                    id="hardcover-checkbox"
                                                    name="book-binding"
                                                    onChange={() => setBindingType(1)}
                                                />
                                                <span className='text-gray-700 font-medium group-hover:text-blue-600 transition-colors'>Hard Cover</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Publication Platforms Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
                                    <div className="p-2 bg-red-100 rounded-xl">
                                        <Globe className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Publication Platforms</h2>
                                </div>

                                <div className='space-y-2'>
                                    <label className='block text-gray-700 font-semibold text-sm'>
                                        Choose Publication <span className='text-red-500'>*</span>
                                    </label>

                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                                        {bindingType == 0 || bindingType == 1 ? (
                                            <>
                                                {/* DreamBook Publication (woocommerce/dream) */}
                                                <div className='bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300'>
                                                    <div className='p-6'>
                                                        <label className='flex items-center cursor-pointer mb-4'>
                                                            <input
                                                                type='checkbox'
                                                                id="dreambookpublication"
                                                                className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
                                                            />
                                                            <img alt="dream-logo" src='/images/app-icon.png' width={96} height={40} className="object-contain" />
                                                        </label>
                                                        <div className='space-y-2 pt-4 border-t border-gray-100'>
                                                            <label className='block text-gray-700 font-semibold text-sm'>
                                                                Royalty <span className='text-red-500'>*</span>
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                id="dreambookpublicationvalue"
                                                                placeholder="₹50"
                                                                className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Amazon Publication */}
                                                <div className='bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300'>
                                                    <div className='p-6'>
                                                        <label className='flex items-center cursor-pointer mb-4'>
                                                            <input
                                                                type='checkbox'
                                                                id="amazonpublication"
                                                                className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
                                                            />
                                                            <img src='/images/amazon.png' alt="amazon" width={96} height={40} className="object-contain" />
                                                        </label>
                                                        <div className='space-y-2 pt-4 border-t border-gray-100'>
                                                            <label className='block text-gray-700 font-semibold text-sm'>
                                                                Royalty <span className='text-red-500'>*</span>
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                placeholder="₹50"
                                                                id="amazonpublicationvalue"
                                                                className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* ✅ Flipkart Publication */}
                                                <div className='bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300'>
                                                    <div className='p-6'>
                                                        <label className='flex items-center cursor-pointer mb-4'>
                                                            <input
                                                                type='checkbox'
                                                                id="flipkartpublication"
                                                                className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
                                                            />
                                                            <img src='/images/flipkart.png' alt="flipkart" width={96} height={40} className="object-contain" />
                                                        </label>
                                                        <div className='space-y-2 pt-4 border-t border-gray-100'>
                                                            <label className='block text-gray-700 font-semibold text-sm'>
                                                                Royalty <span className='text-red-500'>*</span>
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                placeholder="₹50"
                                                                id="flipkartpublicationvalue"
                                                                className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                            </>
                                        ) : (
                                            <div className='bg-white rounded-2xl border-2 border-blue-500 shadow-lg md:col-span-2 lg:col-span-1'>
                                                <div className='p-6'>
                                                    <div className='flex items-center cursor-pointer mb-4'>
                                                        <img src='/images/kindle.png' className='object-contain' width={126} height={56} />
                                                    </div>
                                                    <div className='space-y-2 pt-4 border-t border-gray-100'>
                                                        <label className='block text-gray-700 font-semibold text-sm'>
                                                            Royalty <span className='text-red-500'>*</span>
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            id="kindle-royalty"
                                                            placeholder="₹50"
                                                            className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t-2 border-gray-100'>
                                <div className="text-sm text-gray-600">
                                    <p>All fields marked with <span className="text-red-500">*</span> are required</p>
                                </div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            {role === "author" ? "Submitting..." : "Creating..."}
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5 mr-2" />
                                            {role === "author" ? "Save & Send for Review" : "Publish Book"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export async function getServerSideProps({ req, res }) {
    const role = req.cookies._r || null;
    const user = req.cookies.user || null;
    return {
        props: {
            role: role,
            user: await JSON.parse(user)
        },
    };
}
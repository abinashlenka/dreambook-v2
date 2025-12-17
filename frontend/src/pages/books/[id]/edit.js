// import React, { useEffect, useRef, useState } from 'react';
// import { ChevronLeft, Upload, Book, Users, Tag, Globe, DollarSign, Image as ImageIcon, FileText, Save, Loader2 } from 'lucide-react';
// import Button from '@/components/Button'
// import Input from '@/components/Input'
// import Layout from '@/layout/Layout'
// import Loader from '@/modules/Loader'
// import Uploader from '@/modules/Uploader'
// import { getAllAuthors } from '@/services/APIs/author'
// import { editBook, getSingleBook } from '@/services/APIs/books'
// import Image from 'next/image'
// import { useRouter } from 'next/router'
// import { categories } from '@/Utilities/positions'
// import Select from 'react-select';

// export default function Create({ role }) {
//     const fileRef = useRef(null);
//     const [authors, setAuthors] = useState();
//     const [loading, setLoading] = useState(true);
//     const [bindingType, setBindingType] = useState(0);
//     const [cover, setCover] = useState(null);
//     const router = useRouter();
//     const formRef = useRef(null);
//     const [data, setData] = useState(null);

//     const [dreamCheck, setDreamCheck] = useState(true);
//     const [amazonCheck, setAmazonCheck] = useState(true);
//     const [flipkartCheck, setFlipkartCheck] = useState(true);
//     const [kindleCheck, setKindleCheck] = useState(false);

//     const [dreamValue, setDreamValue] = useState(0);
//     const [amazonValue, setAmazonValue] = useState(0);
//     const [flipkartValue, setFlipkartValue] = useState(0);
//     const [kindleValue, setKindleValue] = useState(0);

//     const handleCover = (val) => {
//         console.log(val)
//         setCover(val);
//     }

//     const setRoyalty = (book) => {
//         for (let i = 0; i < book.platforms.length; i++) {
//             if (book.platforms[i].platform == "dream") {
//                 setDreamCheck(true)
//                 setDreamValue(book.platforms[i]["royalty"]);
//             }

//             if (book.platforms[i].platform == "amazon") {
//                 setAmazonCheck(true)
//                 setAmazonValue(book.platforms[i]["royalty"]);
//             }

//             if (book.platforms[i].platform == "flipkart") {
//                 setFlipkartCheck(true)
//                 setFlipkartValue(book.platforms[i]["royalty"]);
//             }

//             if (book.platforms[i].platform == "kindle") {
//                 setKindleCheck(true)
//                 setKindleValue(book.platforms[i]["royalty"]);
//             }
//         }
//     }

//     const saveBookDetails = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//         try {
//             const payload = new FormData();
//             const formData = new FormData(e.target);
//             const title = formData.get("title");
//             const subtitle = formData.get("sub-title");
//             const description = formData.get("description");
//             const isbn = formData.get("isbn");
//             const author = formData.get("author");
//             const category = formData.get("category");
//             const language = formData.get("language");
//             const price = formData.get("price");
//             const offerPrice = formData.get("offer-price");
//             let offerExpiry = formData.get("offer-expiry");
//             if (formData.get("offer-expiry-type") === "lifetime") {
//                 offerExpiry = null;
//             }
//             const platforms = [];

//             if (bindingType === 0) {
//                 payload.append("bindingSize[0]", "paperBack");
//                 if (document.getElementById("dreambookpublication").checked) {
//                     platforms.push({ platform: "dream", royalty: parseInt(document.getElementById("dreambookpublicationvalue").value) });
//                 }
//                 if (document.getElementById("amazonpublication").checked) {
//                     platforms.push({ platform: "amazon", royalty: parseInt(document.getElementById("amazonpublicationvalue").value) });
//                 }
//                 // if (document.getElementById("flipkartpublication").checked) {
//                 //     platforms.push({ platform: "flipkart", royalty: parseInt(document.getElementById("flipkartpublicationvalue").value) });
//                 // }
//             } else if (bindingType === 1) {
//                 payload.append("bindingSize[0]", "hardCover");
//                 if (document.getElementById("dreambookpublication").checked) {
//                     platforms.push({ platform: "dream", royalty: parseInt(document.getElementById("dreambookpublicationvalue").value) });
//                 }
//                 if (document.getElementById("amazonpublication").checked) {
//                     platforms.push({ platform: "amazon", royalty: parseInt(document.getElementById("amazonpublicationvalue").value) });
//                 }
//                 // if (document.getElementById("flipkartpublication").checked) {
//                 //     platforms.push({ platform: "flipkart", royalty: parseInt(document.getElementById("flipkartpublicationvalue").value) });
//                 // }
//             } else {
//                 payload.append("bindingSize[0]", "ebook");
//                 const royalty = parseInt(document.getElementById("kindle-royalty").value);
//                 platforms.push({ platform: "kindle", royalty });
//             }

//             payload.append("platforms", JSON.stringify(platforms));
//             payload.append("title", title);
//             payload.append("subtitle", subtitle);
//             payload.append("author", author);
//             if (cover && cover !== data?.coverImage?.url) {
//                 payload.append("coverImage", cover);
//             }
//             payload.append("description", description);
//             payload.append("isbnNumber", isbn);
//             payload.append("categories[0]", category);
//             payload.append("language", language);
//             payload.append("price", price);

//             const response = await editBook(payload, router.query["id"]);

//             if (response?.status) {
//                 router.push("/books/" + router.query["id"]);
//             } else {
//                 console.error("❌ Book update failed:", response);
//                 alert("Book update failed. Please check the data and try again.");
//             }
//         } catch (error) {
//             console.error("❌ Unexpected error:", error);
//             alert("Something went wrong. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchData = async (book) => {
//         setLoading(true);
//         const paylaod = {
//             page: 1,
//             limit: 512,
//             role: "author"
//         }
//         const [res1, res2] = await Promise.all([
//             await getSingleBook(book),
//             await getAllAuthors(paylaod)
//         ])
//         if (res2.status) {
//             setAuthors(res2.data.results);
//         }
//         if (res1.status) {
//             setData(res1.data);
//             if (res1.data.bindingSize[0] == "ebook") {
//                 setBindingType(2);
//             }
//             else if (res1.data.bindingSize[0] == "paperBack") {
//                 setBindingType(0);
//             }
//             else {
//                 setBindingType(1);
//             }
//             setRoyalty(res1.data);
//         }

//         setLoading(false);
//     }

//     useEffect(() => {
//         const bookId = router.query["id"];
//         fetchData(bookId);
//     }, []);

//     return (
//         <Layout role={role}>
//             <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
//                 <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 mt-16 lg:mt-0'>
//                     {/* Header Section */}
//                     <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8'>
//                         <Button
//                             variant="white-border"
//                             className="w-fit shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 hover:text-blue-600"
//                             onClick={() => router.push(`/books/${router.query["id"]}`)}
//                         >
//                             <ChevronLeft className="w-4 h-4 mr-2" />

//                         </Button>
//                         <div>
//                             <h1 className='text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2'>
//                                 Edit Book
//                             </h1>
//                             <p className='text-gray-600'>Update your book details and publishing information</p>
//                         </div>
//                     </div>

//                     {/* Loading State */}
//                     {loading && (
//                         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                             <div className="bg-white rounded-2xl p-8 flex items-center gap-4 shadow-2xl">
//                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                                 <span className="text-lg font-medium text-gray-800">Loading book data...</span>
//                             </div>
//                         </div>
//                     )}

//                     {/* Main Form */}
//                     {!loading && data && (
//                         <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
//                             <form onSubmit={saveBookDetails} ref={formRef} className='p-6 lg:p-10 space-y-10'>

//                                 {/* Basic Information Section */}
//                                 <div className="space-y-6">
//                                     <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                         <div className="p-2 bg-blue-100 rounded-xl">
//                                             <Book className="w-6 h-6 text-blue-600" />
//                                         </div>
//                                         <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
//                                     </div>

//                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                         <div className='space-y-2'>
//                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                 Book Title <span className='text-red-500'>*</span>
//                                             </label>
//                                             <Input
//                                                 defaultValue={data?.title}
//                                                 type="text"
//                                                 placeholder="Enter book title"
//                                                 name="title"
//                                                 className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                             />
//                                         </div>

//                                         <div className='space-y-2'>
//                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                 Book Subtitle <span className='text-gray-400'>(Optional)</span>
//                                             </label>
//                                             <Input
//                                                 defaultValue={data?.subtitle}
//                                                 type="text"
//                                                 placeholder="Enter book subtitle"
//                                                 name="sub-title"
//                                                 className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                             />
//                                         </div>
//                                     </div>

//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Book Short Description <span className='text-red-500'>*</span>
//                                         </label>
//                                         <textarea
//                                             defaultValue={data?.description}
//                                             rows="5"
//                                             placeholder="Enter short description"
//                                             name="description"
//                                             className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 transition-all duration-200 resize-none'
//                                         />
//                                     </div>

//                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                         <div className='space-y-2'>
//                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                 ISBN Number <span className='text-red-500'>*</span>
//                                             </label>
//                                             <Input
//                                                 defaultValue={data?.isbnNumber}
//                                                 type="text"
//                                                 name="isbn"
//                                                 placeholder="Enter book ISBN number"
//                                                 className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                             />
//                                         </div>

//                                         <div className='space-y-2'>
//                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                 Book Author <span className='text-red-500'>*</span>
//                                             </label>
//                                             <div className="relative">
//                                                 <Select
//                                                     name="author"
//                                                     classNamePrefix="react-select"
//                                                     placeholder="Search and select an author"
//                                                     defaultValue={authors?.find(author => author._id === data?.author?._id)}
//                                                     getOptionLabel={(e) => e.name}
//                                                     getOptionValue={(e) => e._id}
//                                                     options={authors || []}
//                                                     onChange={(selectedOption) => {
//                                                         const hiddenInput = document.querySelector('input[name="author"]');
//                                                         if (hiddenInput) hiddenInput.value = selectedOption?._id;
//                                                     }}
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
//                                                 <input type="hidden" name="author" defaultValue={data?.author?._id} />
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Category and Language Section */}
//                                 <div className="space-y-6">
//                                     <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                         <div className="p-2 bg-purple-100 rounded-xl">
//                                             <Tag className="w-6 h-6 text-purple-600" />
//                                         </div>
//                                         <h2 className="text-2xl font-bold text-gray-900">Category & Details</h2>
//                                     </div>

//                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                         <div className='space-y-2'>
//                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                 Book Category <span className='text-red-500'>*</span>
//                                             </label>
//                                             <select
//                                                 name="category"
//                                                 defaultValue={data?.categories}
//                                                 className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 transition-all duration-200'
//                                             >
//                                                 {categories.map((item, index) => (
//                                                     <option key={`category-${index}`} value={item.value}>
//                                                         {item.value}
//                                                     </option>
//                                                 ))}
//                                             </select>
//                                         </div>

//                                         <div className='space-y-2'>
//                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                 Language <span className='text-red-500'>*</span>
//                                             </label>
//                                             <select
//                                                 name='language'
//                                                 defaultValue={data?.language}
//                                                 className='w-full bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-gray-800 transition-all duration-200'
//                                             >
//                                                 <option value="English">English</option>

//                                                 <option value="Hindi">Hindi</option>
//                                                 <option value="Telugu">Others</option>

//                                             </select>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Cover Upload Section */}
//                                 <div className="space-y-6">
//                                     <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                         <div className="p-2 bg-green-100 rounded-xl">
//                                             <ImageIcon className="w-6 h-6 text-green-600" />
//                                         </div>
//                                         <h2 className="text-2xl font-bold text-gray-900">Book Cover</h2>
//                                     </div>

//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Upload Cover File <span className='text-red-500'>*</span>
//                                             <span className='text-gray-500 font-normal'> (max size 1mb in JPEG or PNG format only)</span>
//                                         </label>
//                                         <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-all duration-200">
//                                             <Uploader existingUrl={data?.coverImage?.url} handler={handleCover} title="Upload Book Cover" />
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Pricing Section */}
//                                 <div className="space-y-6">
//                                     <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                         <div className="p-2 bg-yellow-100 rounded-xl">
//                                             <DollarSign className="w-6 h-6 text-yellow-600" />
//                                         </div>
//                                         <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
//                                     </div>

//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Book Price <span className='text-red-500'>*</span>
//                                         </label>
//                                         <Input
//                                             type="number"
//                                             name="price"
//                                             placeholder="₹299"
//                                             onWheel={(e) => e.target.blur()}
//                                             defaultValue={data?.price}
//                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl max-w-xs"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Binding Type Section */}
//                                 <div className="space-y-6">
//                                     <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                         <div className="p-2 bg-indigo-100 rounded-xl">
//                                             <FileText className="w-6 h-6 text-indigo-600" />
//                                         </div>
//                                         <h2 className="text-2xl font-bold text-gray-900">Binding Type</h2>
//                                     </div>

//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Choose Binding Size <span className='text-red-500'>*</span>
//                                         </label>
//                                         <div className='bg-white border-2 border-gray-200 rounded-xl p-6'>
//                                             <div className='flex flex-wrap gap-8'>
//                                                 <label className='flex items-center cursor-pointer group'>
//                                                     <input
//                                                         type='radio'
//                                                         className='w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3'
//                                                         id="paperback-checkbox"
//                                                         name="book-binding"
//                                                         defaultChecked={data?.bindingSize[0] == "paperBack"}
//                                                         onChange={() => setBindingType(0)}
//                                                     />
//                                                     <span className='text-gray-700 font-medium group-hover:text-blue-600 transition-colors'>Paper Back</span>
//                                                 </label>

//                                                 <label className='flex items-center cursor-pointer group'>
//                                                     <input
//                                                         type='radio'
//                                                         className='w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3'
//                                                         id="hardcover-checkbox"
//                                                         name="book-binding"
//                                                         defaultChecked={data?.bindingSize[0] == "hardCover"}
//                                                         onChange={() => setBindingType(1)}
//                                                     />
//                                                     <span className='text-gray-700 font-medium group-hover:text-blue-600 transition-colors'>Hard Cover</span>
//                                                 </label>

//                                                 {/* <label className='flex items-center cursor-pointer group'>
//                                                     <input 
//                                                         type='radio' 
//                                                         className='w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3' 
//                                                         id="ebookcover-checkbox" 
//                                                         name="book-binding" 
//                                                         defaultChecked={data?.bindingSize[0] == "ebook"} 
//                                                         onChange={() => setBindingType(2)} 
//                                                     />
//                                                     <span className='text-gray-700 font-medium group-hover:text-blue-600 transition-colors'>Ebook</span>
//                                                 </label> */}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Publication Platforms Section */}
//                                 <div className="space-y-6">
//                                     <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                         <div className="p-2 bg-red-100 rounded-xl">
//                                             <Globe className="w-6 h-6 text-red-600" />
//                                         </div>
//                                         <h2 className="text-2xl font-bold text-gray-900">Publication Platforms</h2>
//                                     </div>

//                                     <div className='space-y-2'>
//                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                             Choose Publication <span className='text-red-500'>*</span>
//                                         </label>

//                                         <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
//                                             {bindingType == 0 || bindingType == 1 ? (
//                                                 <>
//                                                     <div className={`bg-white rounded-2xl border-2 transition-all duration-300 ${dreamCheck ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
//                                                         <div className='p-6'>
//                                                             <label className='flex items-center cursor-pointer mb-4'>
//                                                                 <input
//                                                                     type='checkbox'
//                                                                     id="dreambookpublication"
//                                                                     defaultChecked={dreamCheck}
//                                                                     className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                                     onChange={(e) => setDreamCheck(e.target.checked)}
//                                                                 />
//                                                                 <Image alt="dream-logo" src='/images/dream-book-logo.png' width={126} height={56} className="object-contain" />
//                                                             </label>
//                                                             {dreamCheck && (
//                                                                 <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                                                         Royalty <span className='text-red-500'>*</span>
//                                                                     </label>
//                                                                     <Input
//                                                                         type="number"
//                                                                         id="dreambookpublicationvalue"
//                                                                         placeholder="₹50"
//                                                                         defaultValue={dreamValue}
//                                                                         className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                                     />
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                     </div>

//                                                     <div className={`bg-white rounded-2xl border-2 transition-all duration-300 ${amazonCheck ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
//                                                         <div className='p-6'>
//                                                             <label className='flex items-center cursor-pointer mb-4'>
//                                                                 <input
//                                                                     type='checkbox'
//                                                                     id="amazonpublication"
//                                                                     defaultChecked={amazonCheck}
//                                                                     className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                                     onChange={(e) => setAmazonCheck(e.target.checked)}
//                                                                 />
//                                                                 <img src='/images/dream-big.png' width={126} height={56} className="object-contain" />
//                                                             </label>
//                                                             {amazonCheck && (
//                                                                 <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                                                         Royalty <span className='text-red-500'>*</span>
//                                                                     </label>
//                                                                     <Input
//                                                                         type="number"
//                                                                         placeholder="₹50"
//                                                                         id="amazonpublicationvalue"
//                                                                         defaultValue={amazonValue}
//                                                                         className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                                     />
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                     </div>

//                                                     <div className={`bg-white rounded-2xl border-2 transition-all duration-300 ${flipkartCheck ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
//                                                         <div className='p-6'>
//                                                             <label className='flex items-center cursor-pointer mb-4'>
//                                                                 <input 
//                                                                     type='checkbox' 
//                                                                     id="flipkartpublication" 
//                                                                     defaultChecked={flipkartCheck} 
//                                                                     className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                                     onChange={(e) => setFlipkartCheck(e.target.checked)}
//                                                                 />
//                                                                 <img src='/images/flipkart-big.png' width={126} height={56} className="object-contain" />
//                                                             </label>
//                                                             {flipkartCheck && (
//                                                                 <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                                     <label className='block text-gray-700 font-semibold text-sm'>
//                                                                         Royalty <span className='text-red-500'>*</span>
//                                                                     </label>
//                                                                     <Input 
//                                                                         type="number" 
//                                                                         placeholder="₹50" 
//                                                                         id="flipkartpublicationvalue" 
//                                                                         defaultValue={flipkartValue}
//                                                                         className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                                     />
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                     </div>
//                                                 </>
//                                             ) : (
//                                                 <div className='bg-white rounded-2xl border-2 border-blue-500 shadow-lg md:col-span-2 lg:col-span-1'>
//                                                     <div className='p-6'>
//                                                         <div className='flex items-center cursor-pointer mb-4'>
//                                                             <img src='/images/kindle.png' className='object-contain' width={126} height={56} />
//                                                         </div>
//                                                         <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                                 Royalty <span className='text-red-500'>*</span>
//                                                             </label>
//                                                             <Input
//                                                                 type="number"
//                                                                 id="kindle-royalty"
//                                                                 placeholder="₹50"
//                                                                 defaultValue={kindleValue}
//                                                                 className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Submit Button */}
//                                 <div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t-2 border-gray-100'>
//                                     <div className="text-sm text-gray-600">
//                                         <p>All fields marked with <span className="text-red-500">*</span> are required</p>
//                                     </div>
//                                     <Button
//                                         type="submit"
//                                         variant="primary"
//                                         className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
//                                         disabled={loading}
//                                     >
//                                         {loading ? (
//                                             <>
//                                                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                                                 Updating...
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <Save className="w-5 h-5 mr-2" />
//                                                 Save
//                                             </>
//                                         )}
//                                     </Button>
//                                 </div>
//                             </form>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </Layout>
//     )
// }

// export async function getServerSideProps({ req, res }) {
//     const role = req.cookies._r || null;
//     return {
//         props: {
//             role: role,
//         },
//     };
// }

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Book, Tag, Globe, DollarSign, Image as ImageIcon, FileText, Save, Loader2 } from 'lucide-react';
import Button from '@/components/Button'
import Input from '@/components/Input'
import Layout from '@/layout/Layout'
import Uploader from '@/modules/Uploader'
import { getAllAuthors } from '@/services/APIs/author'
import { editBook, getSingleBook } from '@/services/APIs/books'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { categories } from '@/Utilities/positions'
import Select from 'react-select';

export default function Create({ role }) {
    const fileRef = useRef(null);
    const [authors, setAuthors] = useState();
    const [loading, setLoading] = useState(true);
    const [bindingType, setBindingType] = useState(0);
    const [cover, setCover] = useState(null);
    const router = useRouter();
    const formRef = useRef(null);
    const [data, setData] = useState(null);

    const [dreamCheck, setDreamCheck] = useState(true);
    const [amazonCheck, setAmazonCheck] = useState(true);
    const [flipkartCheck, setFlipkartCheck] = useState(true);
    const [kindleCheck, setKindleCheck] = useState(false);

    const [dreamValue, setDreamValue] = useState(0);
    const [amazonValue, setAmazonValue] = useState(0);
    const [flipkartValue, setFlipkartValue] = useState(0);
    const [kindleValue, setKindleValue] = useState(0);

    const handleCover = (val) => {
        console.log(val)
        setCover(val);
    }

    const setRoyalty = (book) => {
        for (let i = 0; i < book.platforms.length; i++) {
            if (book.platforms[i].platform == "dream") {
                setDreamCheck(true)
                setDreamValue(book.platforms[i]["royalty"]);
            }

            if (book.platforms[i].platform == "amazon") {
                setAmazonCheck(true)
                setAmazonValue(book.platforms[i]["royalty"]);
            }

            if (book.platforms[i].platform == "flipkart") {
                setFlipkartCheck(true)
                setFlipkartValue(book.platforms[i]["royalty"]);
            }

            if (book.platforms[i].platform == "kindle") {
                setKindleCheck(true)
                setKindleValue(book.platforms[i]["royalty"]);
            }
        }
    }

    const saveBookDetails = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = new FormData();
            const formData = new FormData(e.target);
            const title = formData.get("title");
            const subtitle = formData.get("sub-title");
            const description = formData.get("description");
            const isbn = formData.get("isbn");
            const author = formData.get("author");
            const category = formData.get("category");
            const language = formData.get("language");
            const price = formData.get("price");
            const offerPrice = formData.get("offer-price");
            let offerExpiry = formData.get("offer-expiry");
            if (formData.get("offer-expiry-type") === "lifetime") {
                offerExpiry = null;
            }
            const platforms = [];

            if (bindingType === 0) {
                payload.append("bindingSize[0]", "paperBack");
                if (document.getElementById("dreambookpublication")?.checked) {
                    platforms.push({ platform: "dream", royalty: parseInt(document.getElementById("dreambookpublicationvalue").value) });
                }
                if (document.getElementById("amazonpublication")?.checked) {
                    platforms.push({ platform: "amazon", royalty: parseInt(document.getElementById("amazonpublicationvalue").value) });
                }
                if (document.getElementById("flipkartpublication")?.checked) {
                    platforms.push({ platform: "flipkart", royalty: parseInt(document.getElementById("flipkartpublicationvalue").value) });
                }
            } else if (bindingType === 1) {
                payload.append("bindingSize[0]", "hardCover");
                if (document.getElementById("dreambookpublication")?.checked) {
                    platforms.push({ platform: "dream", royalty: parseInt(document.getElementById("dreambookpublicationvalue").value) });
                }
                if (document.getElementById("amazonpublication")?.checked) {
                    platforms.push({ platform: "amazon", royalty: parseInt(document.getElementById("amazonpublicationvalue").value) });
                }
                if (document.getElementById("flipkartpublication")?.checked) {
                    platforms.push({ platform: "flipkart", royalty: parseInt(document.getElementById("flipkartpublicationvalue").value) });
                }
            } else {
                payload.append("bindingSize[0]", "ebook");
                const royalty = parseInt(document.getElementById("kindle-royalty").value);
                platforms.push({ platform: "kindle", royalty });
            }

            payload.append("platforms", JSON.stringify(platforms));
            payload.append("title", title);
            payload.append("subtitle", subtitle);
            payload.append("author", author);
            if (cover && cover !== data?.coverImage?.url) {
                payload.append("coverImage", cover);
            }
            payload.append("description", description);
            payload.append("isbnNumber", isbn);
            payload.append("categories[0]", category);
            payload.append("language", language);
            payload.append("price", price);

            const response = await editBook(payload, router.query["id"]);

            if (response?.status) {
                router.push("/books/" + router.query["id"]);
            } else {
                console.error("❌ Book update failed:", response);
                alert("Book update failed. Please check the data and try again.");
            }
        } catch (error) {
            console.error("❌ Unexpected error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async (book) => {
        setLoading(true);
        const paylaod = {
            page: 1,
            limit: 512,
            role: "author"
        }
        const [res1, res2] = await Promise.all([
            await getSingleBook(book),
            await getAllAuthors(paylaod)
        ])
        if (res2.status) {
            setAuthors(res2.data.results);
        }
        if (res1.status) {
            setData(res1.data);
            if (res1.data.bindingSize[0] == "ebook") {
                setBindingType(2);
            }
            else if (res1.data.bindingSize[0] == "paperBack") {
                setBindingType(0);
            }
            else {
                setBindingType(1);
            }
            setRoyalty(res1.data);
        }

        setLoading(false);
    }

    useEffect(() => {
        const bookId = router.query["id"];
        fetchData(bookId);
    }, []);

    return (
        <Layout role={role}>
            <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 mt-16 lg:mt-0'>
                    {/* Header Section */}
                    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8'>
                        <Button
                            variant="white-border"
                            className="w-fit shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 hover:text-blue-600"
                            onClick={() => router.push(`/books/${router.query["id"]}`)}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />

                        </Button>
                        <div>
                            <h1 className='text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2'>
                                Edit Book
                            </h1>
                            <p className='text-gray-600'>Update your book details and publishing information</p>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-2xl p-8 flex items-center gap-4 shadow-2xl">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="text-lg font-medium text-gray-800">Loading book data...</span>
                            </div>
                        </div>
                    )}

                    {/* Main Form */}
                    {!loading && data && (
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
                                                defaultValue={data?.title}
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
                                                defaultValue={data?.subtitle}
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
                                            defaultValue={data?.description}
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
                                                defaultValue={data?.isbnNumber}
                                                type="text"
                                                name="isbn"
                                                placeholder="Enter book ISBN number"
                                                className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                            />
                                        </div>

                                        <div className='space-y-2'>
                                            <label className='block text-gray-700 font-semibold text-sm'>
                                                Book Author <span className='text-red-500'>*</span>
                                            </label>
                                            <div className="relative">
                                                <Select
                                                    name="author"
                                                    classNamePrefix="react-select"
                                                    placeholder="Search and select an author"
                                                    defaultValue={authors?.find(author => author._id === data?.author?._id)}
                                                    getOptionLabel={(e) => e.name}
                                                    getOptionValue={(e) => e._id}
                                                    options={authors || []}
                                                    onChange={(selectedOption) => {
                                                        const hiddenInput = document.querySelector('input[name="author"]');
                                                        if (hiddenInput) hiddenInput.value = selectedOption?._id;
                                                    }}
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
                                                <input type="hidden" name="author" defaultValue={data?.author?._id} />
                                            </div>
                                        </div>
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
                                                defaultValue={data?.categories}
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
                                                defaultValue={data?.language}
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
                                            <Uploader existingUrl={data?.coverImage?.url} handler={handleCover} title="Upload Book Cover" />
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
                                            defaultValue={data?.price}
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
                                                        defaultChecked={data?.bindingSize[0] == "paperBack"}
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
                                                        defaultChecked={data?.bindingSize[0] == "hardCover"}
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
                                                    <div className={`bg-white rounded-2xl border-2 transition-all duration-300 ${dreamCheck ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
                                                        <div className='p-6'>
                                                            <label className='flex items-center cursor-pointer mb-4'>
                                                                <input
                                                                    type='checkbox'
                                                                    id="dreambookpublication"
                                                                    defaultChecked={dreamCheck}
                                                                    className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
                                                                    onChange={(e) => setDreamCheck(e.target.checked)}
                                                                />
                                                                <Image alt="dream-logo" src='/images/dream-book-logo.png' width={126} height={56} className="object-contain" />
                                                            </label>
                                                            {dreamCheck && (
                                                                <div className='space-y-2 pt-4 border-t border-gray-100'>
                                                                    <label className='block text-gray-700 font-semibold text-sm'>
                                                                        Royalty <span className='text-red-500'>*</span>
                                                                    </label>
                                                                    <Input
                                                                        type="number"
                                                                        id="dreambookpublicationvalue"
                                                                        placeholder="₹50"
                                                                        defaultValue={dreamValue}
                                                                        className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={`bg-white rounded-2xl border-2 transition-all duration-300 ${amazonCheck ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
                                                        <div className='p-6'>
                                                            <label className='flex items-center cursor-pointer mb-4'>
                                                                <input
                                                                    type='checkbox'
                                                                    id="amazonpublication"
                                                                    defaultChecked={amazonCheck}
                                                                    className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
                                                                    onChange={(e) => setAmazonCheck(e.target.checked)}
                                                                />
                                                                <img src='/images/dream-big.png' width={126} height={56} className="object-contain" />
                                                            </label>
                                                            {amazonCheck && (
                                                                <div className='space-y-2 pt-4 border-t border-gray-100'>
                                                                    <label className='block text-gray-700 font-semibold text-sm'>
                                                                        Royalty <span className='text-red-500'>*</span>
                                                                    </label>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="₹50"
                                                                        id="amazonpublicationvalue"
                                                                        defaultValue={amazonValue}
                                                                        className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={`bg-white rounded-2xl border-2 transition-all duration-300 ${flipkartCheck ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
                                                        <div className='p-6'>
                                                            <label className='flex items-center cursor-pointer mb-4'>
                                                                <input 
                                                                    type='checkbox' 
                                                                    id="flipkartpublication" 
                                                                    defaultChecked={flipkartCheck} 
                                                                    className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
                                                                    onChange={(e) => setFlipkartCheck(e.target.checked)}
                                                                />
                                                                <img src='/images/flipkart-big.png' width={126} height={56} className="object-contain" />
                                                            </label>
                                                            {flipkartCheck && (
                                                                <div className='space-y-2 pt-4 border-t border-gray-100'>
                                                                    <label className='block text-gray-700 font-semibold text-sm'>
                                                                        Royalty <span className='text-red-500'>*</span>
                                                                    </label>
                                                                    <Input 
                                                                        type="number" 
                                                                        placeholder="₹50" 
                                                                        id="flipkartpublicationvalue" 
                                                                        defaultValue={flipkartValue}
                                                                        className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
                                                                    />
                                                                </div>
                                                            )}
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
                                                                defaultValue={kindleValue}
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
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5 mr-2" />
                                                Save
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export async function getServerSideProps({ req, res }) {
    const role = req.cookies._r || null;
    return {
        props: {
            role: role,
        },
    };
}
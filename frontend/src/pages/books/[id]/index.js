// import React, { useEffect, useRef, useState } from 'react';
// import { ChevronLeft, Book, Tag, Globe, DollarSign, Image as ImageIcon, FileText, Save, Loader2 } from 'lucide-react';
// import Button from '@/components/Button'
// import Input from '@/components/Input'
// import Layout from '@/layout/Layout'
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
//                 if (document.getElementById("dreambookpublication")?.checked) {
//                     platforms.push({ platform: "dream", royalty: parseInt(document.getElementById("dreambookpublicationvalue").value) });
//                 }
//                 if (document.getElementById("amazonpublication")?.checked) {
//                     platforms.push({ platform: "amazon", royalty: parseInt(document.getElementById("amazonpublicationvalue").value) });
//                 }
//                  if (document.getElementById("flipkartpublication")?.checked) {
//                      platforms.push({ platform: "flipkart", royalty: parseInt(document.getElementById("flipkartpublicationvalue").value) });
//                  }
//             } else if (bindingType === 1) {
//                 payload.append("bindingSize[0]", "hardCover");
//                 if (document.getElementById("dreambookpublication")?.checked) {
//                     platforms.push({ platform: "dream", royalty: parseInt(document.getElementById("dreambookpublicationvalue").value) });
//                 }
//                 if (document.getElementById("amazonpublication")?.checked) {
//                     platforms.push({ platform: "amazon", royalty: parseInt(document.getElementById("amazonpublicationvalue").value) });
//                 }
//                  if (document.getElementById("flipkartpublication")?.checked) {
//                      platforms.push({ platform: "flipkart", royalty: parseInt(document.getElementById("flipkartpublicationvalue").value) });
//                  }
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
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Publication Platforms Section - RESTRICTED FOR EMPLOYEE */}
//                                 {role !== "employee" && (
//                                     <div className="space-y-6">
//                                         <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
//                                             <div className="p-2 bg-red-100 rounded-xl">
//                                                 <Globe className="w-6 h-6 text-red-600" />
//                                             </div>
//                                             <h2 className="text-2xl font-bold text-gray-900">Publication Platforms</h2>
//                                         </div>

//                                         <div className='space-y-2'>
//                                             <label className='block text-gray-700 font-semibold text-sm'>
//                                                 Choose Publication <span className='text-red-500'>*</span>
//                                             </label>

//                                             <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
//                                                 {bindingType == 0 || bindingType == 1 ? (
//                                                     <>
//                                                         <div className={`bg-white rounded-2xl border-2 transition-all duration-300 ${dreamCheck ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
//                                                             <div className='p-6'>
//                                                                 <label className='flex items-center cursor-pointer mb-4'>
//                                                                     <input
//                                                                         type='checkbox'
//                                                                         id="dreambookpublication"
//                                                                         defaultChecked={dreamCheck}
//                                                                         className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                                         onChange={(e) => setDreamCheck(e.target.checked)}
//                                                                     />
//                                                                     <Image alt="dream-logo" src='/images/dream-book-logo.png' width={126} height={56} className="object-contain" />
//                                                                 </label>
//                                                                 {dreamCheck && (
//                                                                     <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                                                             Royalty <span className='text-red-500'>*</span>
//                                                                         </label>
//                                                                         <Input
//                                                                             type="number"
//                                                                             id="dreambookpublicationvalue"
//                                                                             placeholder="₹50"
//                                                                             defaultValue={dreamValue}
//                                                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                                         />
//                                                                     </div>
//                                                                 )}
//                                                             </div>
//                                                         </div>

//                                                         <div className={`bg-white rounded-2xl border-2 transition-all duration-300 ${amazonCheck ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
//                                                             <div className='p-6'>
//                                                                 <label className='flex items-center cursor-pointer mb-4'>
//                                                                     <input
//                                                                         type='checkbox'
//                                                                         id="amazonpublication"
//                                                                         defaultChecked={amazonCheck}
//                                                                         className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                                         onChange={(e) => setAmazonCheck(e.target.checked)}
//                                                                     />
//                                                                     <img src='/images/dream-big.png' width={126} height={56} className="object-contain" />
//                                                                 </label>
//                                                                 {amazonCheck && (
//                                                                     <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                                                             Royalty <span className='text-red-500'>*</span>
//                                                                         </label>
//                                                                         <Input
//                                                                             type="number"
//                                                                             placeholder="₹50"
//                                                                             id="amazonpublicationvalue"
//                                                                             defaultValue={amazonValue}
//                                                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                                         />
//                                                                     </div>
//                                                                 )}
//                                                             </div>
//                                                         </div>

//                                                         <div className={`bg-white rounded-2xl border-2 transition-all duration-300 ${flipkartCheck ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}>
//                                                             <div className='p-6'>
//                                                                 <label className='flex items-center cursor-pointer mb-4'>
//                                                                     <input
//                                                                         type='checkbox'
//                                                                         id="flipkartpublication"
//                                                                         defaultChecked={flipkartCheck}
//                                                                         className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3'
//                                                                         onChange={(e) => setFlipkartCheck(e.target.checked)}
//                                                                     />
//                                                                     <img src='/images/flipkart-big.png' width={126} height={56} className="object-contain" />
//                                                                 </label>
//                                                                 {flipkartCheck && (
//                                                                     <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                                         <label className='block text-gray-700 font-semibold text-sm'>
//                                                                             Royalty <span className='text-red-500'>*</span>
//                                                                         </label>
//                                                                         <Input
//                                                                             type="number"
//                                                                             placeholder="₹50"
//                                                                             id="flipkartpublicationvalue"
//                                                                             defaultValue={flipkartValue}
//                                                                             className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                                         />
//                                                                     </div>
//                                                                 )}
//                                                             </div>
//                                                         </div>
//                                                     </>
//                                                 ) : (
//                                                     <div className='bg-white rounded-2xl border-2 border-blue-500 shadow-lg md:col-span-2 lg:col-span-1'>
//                                                         <div className='p-6'>
//                                                             <div className='flex items-center cursor-pointer mb-4'>
//                                                                 <img src='/images/kindle.png' className='object-contain' width={126} height={56} />
//                                                             </div>
//                                                             <div className='space-y-2 pt-4 border-t border-gray-100'>
//                                                                 <label className='block text-gray-700 font-semibold text-sm'>
//                                                                     Royalty <span className='text-red-500'>*</span>
//                                                                 </label>
//                                                                 <Input
//                                                                     type="number"
//                                                                     id="kindle-royalty"
//                                                                     placeholder="₹50"
//                                                                     defaultValue={kindleValue}
//                                                                     className="border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all duration-200 rounded-xl"
//                                                                 />
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}

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
import React, { useEffect, useState } from 'react';
import Layout from '@/layout/Layout';
import { useRouter } from 'next/router';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import { permissionHandler } from '@/Utilities/permissions';
import { getAuthors } from '@/services/APIs/author'
import { getSingleBook, updateStatus } from '@/services/APIs/books';
import { getOrdersByName } from '@/services/APIs/orders';
import Script from 'next/script';
import SalesOverview from '@/components/SalesOverview';
import { toast } from '@/Utilities/toasters';
import Image from 'next/image';
import AssignToModal from '@/components/Book/AssignEmployee';
import { getAllEmployee } from '@/services/APIs/bookAssign';
import EmployeeDetailModal from "@/components/Book/EmployeeDetailModal";
import AddAuthorModal from '@/components/Book/AddAuthorModal';

export default function BookDetail({ role }) {
   const router = useRouter();
   const bookId = router.query.id;
   const [data, setData] = useState({});
   const [selectedEmployee, setSelectedEmployee] = useState(null);
   const [assignedEmployee, setAssignedEmployee] = useState([])
   const [loading, setLoading] = useState(true);
   const [orders, setOrders] = useState([]);

   const [showPayments, setShowPayments] = useState(false);
   const [dummyPayments, setDummyPayments] = useState([]);
   const [isUpdating, setIsUpdating] = useState(false);
   const [showAssignModal, setShowAssignModal] = useState({ open: false, mode: "assign" });

   const [empEmails, setEmpEmails] = useState([]);
   const [authorData, setAuthorData] = useState([]);
   const [userId, setUserId] = useState(null);
   const [showAddAuthorModal, setShowAddAuthorModal] = useState(false);

   const bookType = {
      paperBack: 'Paper Back',
      hardCover: 'Hard Cover',
      ebook: 'Ebook',
   };

   useEffect(() => {
      const id = localStorage.getItem("userId");
      if (id) setUserId(id);
      console.log("🚀 BookDetail Page Loaded - Version: PNG Icons");
   }, []);

   useEffect(() => {
      if (data?.assignedEmployees) {
         setAssignedEmployee(data.assignedEmployees);
      }
   }, [data]);

   const fetchData = async (bookId) => {
      setLoading(true);
      try {
         const res = await getSingleBook(bookId);
         const authordata = await getAuthors()
         setAuthorData(authordata?.data)
         if (res.status) {
            setData(res.data);
         } else if (res.message?.toLowerCase().includes('session')) {
            toast('Session expired. Please login again', 'error');
            router.push('/auth/signin');
         } else {
            toast(res.message || 'Failed to fetch book details', 'error');
         }
      } catch (error) {
         console.error("Error fetching book:", error);
         if (error.message?.toLowerCase().includes('session')) {
            toast('Session expired. Please login again', 'error');
            router.push('/auth/signin');
         }
      } finally {
         setLoading(false);
      }
   };

   const fetchOrders = async (bookId, title) => {
      try {
         const res = await getOrdersByName(title, bookId);
         if (res.status) {
            const ordersArray = res.data.orders || [];
            let matched = ordersArray.filter(order => {
               if (order.line_items?.some(item => item.bookId?.toString() === bookId.toString())) return true;
               if (order.source === "amazon" && order.bookId?.toString() === bookId.toString()) return true;
               return false;
            });

            if (matched.length === 0) {
               const fallback = ordersArray.filter(order =>
                  order.line_items?.some(item => item.name?.toLowerCase().includes(title.toLowerCase()))
               );
               matched = fallback;
            }
            setOrders(matched);
         } else if (res.message?.toLowerCase().includes('session')) {
            toast('Session expired. Please login again', 'error');
            router.push('/auth/signin');
         } else {
            toast(res.message || 'Failed to fetch orders', 'error');
         }
      } catch (err) {
         console.error("Failed to fetch orders:", err);
         setOrders([]);
      }
   };

   const fetchEmployees = async () => {
      try {
         const res = await getAllEmployee();
         setEmpEmails(res.data || []);
      } catch (err) {
         console.error("Failed to fetch employees:", err);
      }
   };

   useEffect(() => {
      if (role === 'admin') {
         fetchEmployees();
      }
   }, [role]);

   const updateStatusForBook = async (status) => {
      try {
         setIsUpdating(true);
         setLoading(true);

         const bookId = router.query.id;
         const payload = { status, userId };

         const res = await updateStatus(payload, bookId);

         if (res.status) {
            toast(`Book ${status} successfully`, 'success');
            await fetchData(bookId);
         } else if (res.code === 401 || res.message?.toLowerCase().includes('session')) {
            toast('Session expired. Please login again.', 'error');
            router.push('/login');
         } else {
            toast(res.message || 'Failed to update book status', 'error');
         }
      } catch (error) {
         console.error("Status update error:", error);
         toast('An error occurred while updating book status', 'error');
      } finally {
         setIsUpdating(false);
         setLoading(false);
      }
   };

   useEffect(() => {
      const bookId = router.query.id;
      if (bookId) fetchData(bookId);
   }, [router.query.id]);

   useEffect(() => {
      const bookId = router.query.id;
      if (bookId && data.title) fetchOrders(bookId, data.title);
   }, [data.title, router.query.id]);

   // ✅ UPDATED: Added Flipkart to the list
   const allPlatforms = ['amazon', 'woocommerce', 'flipkart'];

   // ✅ UPDATED: Added Capitalized Label
   const platformLabels = {
      amazon: "Amazon",
      woocommerce: "DreamBook",
      flipkart: "Flipkart", 
      dream: "DreamBook" // Fallback if data uses 'dream'
   };

   // ✅ UPDATED ICONS: Points to the .png files you requested
   const getPlatformImage = (platform) => {
      if (!platform) return '/images/default-book.png';
    
      switch (platform.toLowerCase()) {
         case 'amazon': 
            return '/images/amazon.png';
         case 'woocommerce': 
         case 'dream': 
            return '/images/app-icon.png';
         case 'flipkart': 
            return '/images/flipkart.png';
         default: 
            return '/images/default-book.png';
      }
   };

   const platformWiseSummary = () => {
      const summary = {};
      orders.forEach(order => {
         const platform = order.source?.toLowerCase();
         if (!platform) return;
        
         order.line_items?.forEach(item => {
            if (item.bookId?.toString() !== data._id?.toString()) return;
            const quantity = parseInt(item.quantity || 0);
            const itemPrice = parseFloat(item.price || 0);
            const totalAmount = itemPrice * quantity;
            if (!summary[platform]) {
               summary[platform] = { sales: 0, price: itemPrice, returned: 0, totalEarnings: 0, returnRoyalty: 0 };
            }
            summary[platform].sales += quantity;
            summary[platform].totalEarnings += totalAmount;
         });
      });
      return summary;
   };

   const platformSummary = platformWiseSummary();
   const totalPayAmount = Object.values(platformSummary).reduce((sum, item) => sum + (item.totalEarnings - item.returnRoyalty), 0);

   const bookSales = orders.flatMap(order =>
      (order.line_items || []).filter(item => item.bookId?.toString() === data._id?.toString()).map(item => ({
         platform: order.source, quantity: item.quantity || 1, price: item.price || 0, date: new Date(order.createdAt).toLocaleDateString()
      }))
   );

   const openRazorpay = () => {
      const options = {
         key: 'rzp_test_dummyKey',
         amount: totalPayAmount * 100,
         currency: 'INR',
         name: 'DreamBooks Admin Payment',
         description: 'Royalty Payment to Author',
         handler: function (response) {
            alert(`Payment successful! Transaction ID: ${response.razorpay_payment_id}`);
            setDummyPayments(prev => [...prev, { id: response.razorpay_payment_id, amount: totalPayAmount, date: new Date().toLocaleString() }]);
         },
         prefill: { name: data.author?.name || 'Author', email: data.author?.email || 'author@example.com' },
         theme: { color: '#3B82F6' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
   };

   const isAssignedToMe = role === 'employee' && (
      assignedEmployee.some(emp => String(emp._id) === String(userId)) || 
      (data.author && String(data.author._id || data.author) === String(userId))
   );

   return (
      <Layout role={role}>
         <Script src="https://checkout.razorpay.com/v1/checkout.js" />
         <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
               <nav className="flex items-center space-x-2 text-sm mb-8">
                  <button onClick={() => router.push(`/books`)} className="flex items-center px-3 py-2 rounded-lg hover:bg-white/60 transition-all duration-200 text-gray-600 hover:text-blue-600 group">
                     <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                     </svg>
                     <span className="font-medium">All Books</span>
                  </button>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-900 font-semibold">Book Details</span>
               </nav>

               {loading ? (
                  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
                     <div className="flex flex-col items-center justify-center text-center space-y-6">
                        <Image alt="dream-logo" src="/images/dream-book-logo.png" width={126} height={56} className="object-contain mx-auto" />
                        <div className="space-y-2">
                           <h2 className="text-2xl font-bold text-gray-800">DreamBook Publishing</h2>
                           <p className="text-gray-600 text-sm sm:text-base">Please wait while we fetch your data...</p>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-8">
                     <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                           <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                 <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">{data.title}</h1>
                              </div>
                              <p className="text-gray-600 text-lg leading-relaxed line-clamp-3">{data.description}</p>
                              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                                 <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    by {data.author?.name || "Unknown Author"}
                                 </span>
                                 <span className="flex items-center">₹{data.price}</span>
                                 <Badge variant={data.status} className="px-4 py-2 text-sm font-semibold w-fit">
                                    {data.status?.charAt(0).toUpperCase() + data.status?.slice(1)}
                                 </Badge>
                              </div>
                           </div>

                           <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:w-48">
                              {permissionHandler('editBook', role) && (
                                 <Button variant="primary" className="px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold" onClick={() => router.push(`/books/${router.query.id}/edit`)}>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Book
                                 </Button>
                              )}

                              {((role === "admin") || (role === "employee" && isAssignedToMe)) && (
                                 <div className="relative">
                                    <select
                                       className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                       value={data.status}
                                       onChange={(e) => updateStatusForBook(e.target.value)}
                                       disabled={isUpdating}
                                    >
                                       <option value="pending">⏳ Pending Review</option>
                                       <option value="approved">✅ Approved</option>
                                       <option value="rejected">❌ Rejected</option>
                                    </select>
                                    {isUpdating && (
                                       <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-1">
                           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 sticky top-8">
                              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl mb-6 bg-gradient-to-br from-gray-100 to-gray-200">
                                 <img src={data.coverImage?.url} alt="Book Cover" className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 rounded-xl" />
                              </div>
                              {assignedEmployee?.length > 0 ? (
                                 <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                       <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                       Assigned To
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                       {assignedEmployee.map((emp) => (
                                          <button key={emp._id} className="flex items-center px-3 py-2 rounded-lg bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group" onClick={() => setSelectedEmployee(emp)} title={emp.name}>
                                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold flex items-center justify-center text-sm mr-2 group-hover:scale-110 transition-transform duration-200">{emp.name.charAt(0).toUpperCase()}</div>
                                             <span className="text-sm font-medium text-gray-700">{emp.name}</span>
                                          </button>
                                       ))}
                                    </div>
                                 </div>
                              ) : (
                                 <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                    <span className="text-gray-500 text-sm">No employees assigned yet.</span>
                                 </div>
                              )}
                           </div>
                        </div>

                        <div className="xl:col-span-2 space-y-8">
                           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 lg:p-8">
                              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                 <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 Book Information
                              </h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-4 rounded-xl transition-all duration-200">
                                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Author</div>
                                    <div className="text-lg font-bold text-gray-900">{data.author?.name || "Unknown"}</div>
                                 </div>
                                 <div className="group hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 p-4 rounded-xl transition-all duration-200">
                                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Price</div>
                                    <div className="text-lg font-bold text-green-600 flex items-center">₹{data.price}</div>
                                 </div>
                                 <div className="group hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 p-4 rounded-xl transition-all duration-200">
                                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Genre</div>
                                    <div className="text-lg font-bold text-gray-900">{data.categories?.[0] || 'N/A'}</div>
                                 </div>
                                 <div className="group hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 p-4 rounded-xl transition-all duration-200">
                                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Type</div>
                                    <div className="text-lg font-bold text-gray-900">{bookType[data.bindingSize?.[0]] || 'N/A'}</div>
                                 </div>
                                 <div className="group hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 p-4 rounded-xl transition-all duration-200">
                                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Language</div>
                                    <div className="text-lg font-bold text-gray-900">{data.language}</div>
                                 </div>
                                 <div className="group hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 p-4 rounded-xl transition-all duration-200">
                                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">ISBN</div>
                                    <div className="text-lg font-bold text-gray-900 font-mono">{data.isbnNumber || "Not Available"}</div>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 lg:p-8">
                              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                 <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" /></svg>
                                 Actions
                              </h2>

                              <div className="space-y-4">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {permissionHandler("addAuthorToBook", role) && (
                                       <Button variant="primary" className={`px-6 py-4 rounded-xl shadow-md transition-all duration-200 font-semibold group hover:shadow-lg`} onClick={() => setShowAddAuthorModal(true)}>
                                          <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                          {data.author ? "Reassign Author" : "Add Author"}
                                       </Button>
                                    )}

                                    {role === "admin" && assignedEmployee?.length === 0 && (
                                       <Button variant="primary" className={`px-6 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold group ${data.status !== "pending" ? "opacity-50 cursor-not-allowed" : ""}`} onClick={() => data.status === "pending" && setShowAssignModal({ open: true, mode: "assign" })} disabled={data.status !== "pending"} title={data.status !== "pending" ? "Can only assign employees to pending books" : "Assign Employee"}>
                                          <svg className={`w-5 h-5 mr-2 transition-transform duration-200 ${data.status === "pending" ? "group-hover:scale-110" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                          {data.status === "pending" ? "Assign Employee" : "Assignment Locked"}
                                       </Button>
                                    )}

                                    {role === "admin" && assignedEmployee?.length > 0 && (
                                       <Button variant="primary" className={`px-6 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold group ${data.status !== "pending" ? "opacity-50 cursor-not-allowed" : ""}`} onClick={() => data.status === "pending" && setShowAssignModal({ open: true, mode: "reassign" })} disabled={data.status !== "pending"} title={data.status !== "pending" ? "Can only reassign employees for pending books" : "Re-Assign Employee"}>
                                          <svg className={`w-5 h-5 mr-2 transition-transform duration-300 ${data.status === "pending" ? "group-hover:rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                          {data.status === "pending" ? "Re-Assign Employee" : "Assignment Locked"}
                                       </Button>
                                    )}
                                 </div>

                                 {((role === 'admin') || (role === 'employee' && isAssignedToMe)) && data.status === 'pending' && (
                                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                       <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                          Review Submission
                                       </h3>
                                       <p className="text-blue-700 mb-4 text-sm">This book is pending approval. Please review and choose an action.</p>
                                       <div className="flex flex-col sm:flex-row gap-3">
                                          <Button variant="success" className="px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold group" onClick={() => updateStatusForBook('approved')} disabled={isUpdating}>
                                             {isUpdating ? <div className="flex items-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Processing...</div> : <><svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Approve Book</>}
                                          </Button>
                                          <Button variant="danger" className="px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold group" onClick={() => updateStatusForBook('rejected')} disabled={isUpdating}>
                                             {isUpdating ? <div className="flex items-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Processing...</div> : <><svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Reject Book</>}
                                          </Button>
                                       </div>
                                    </div>
                                 )}

                                 {role === 'author' && data.status === 'pending' && (
                                    <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                                       <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                          Under Review
                                       </h3>
                                       <p className="text-yellow-700 text-sm">Your book has been submitted and is currently waiting for admin approval. You will be notified once the status changes.</p>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                        <div className="p-6 lg:p-8 border-b border-gray-100">
                           <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                              <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                              Sales & Analytics
                           </h2>
                        </div>
                        <SalesOverview
                           data={data}
                           role={role}
                           bookId={bookId}
                           totalPayAmount={totalPayAmount}
                           openRazorpay={openRazorpay}
                           showPayments={showPayments}
                           setShowPayments={setShowPayments}
                           dummyPayments={dummyPayments}
                           platformSummary={platformSummary}
                           allPlatforms={allPlatforms}
                           getPlatformImage={getPlatformImage}
                           platformLabels={platformLabels}
                           bookSales={bookSales}
                        />
                     </div>
                  </div>
               )}

               {/* Modals */}
               {showAssignModal.open && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"><AssignToModal bookId={bookId} empEmailData={empEmails} mode={showAssignModal.mode} onClose={() => setShowAssignModal({ open: false, mode: "assign" })} fetchBookData={() => fetchData(bookId)} /></div></div>}
               {showAddAuthorModal && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"><AddAuthorModal show={showAddAuthorModal} onClose={() => setShowAddAuthorModal(false)} authors={authorData} bookId={bookId} fetchBookData={() => fetchData(bookId)} /></div></div>}
               {selectedEmployee && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"><EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} /></div></div>}
            </div>
         </div>
      </Layout>
   );
}

export async function getServerSideProps({ req }) {
   const role = req.cookies._r || null;
   return {
      props: { role },
   };
}
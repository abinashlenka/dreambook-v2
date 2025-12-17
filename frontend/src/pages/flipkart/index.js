import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/layout/Layout";
import Button from "@/components/Button";
import { UploadCloud, CheckCircle, Calendar, FileSpreadsheet, TrendingUp, Database } from "lucide-react";
import * as XLSX from "xlsx";
import { addFlipkartOrders, getLatestdate } from "../../services/APIs/flipkart";
import Loader from "@/modules/Loader";
import Image from 'next/image'

export default function FlipkartData({ role, id }) {
  const router = useRouter();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [sheetUsed, setSheetUsed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [latestDate, setLatestDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ INCLUSIVE: Allows both admin and employee
if (role !== "admin" && role !== "employee") {
  router.replace("/dashboard");
  return null;
}

  useEffect(() => {
    const fetchLatestDate = async () => {
      try {
        setLoading(true);
        const data = await getLatestdate();
        setLatestDate(data?.latestMonth || "No data");
      } catch (err) {
        console.error("❌ Error fetching latest date:", err);
        setError("Failed to load latest date");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestDate();
  }, []);

  const handleFileChange = (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB. Please upload a smaller file.");
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);
    readExcelCellByCell(file);
  };

  const readExcelCellByCell = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        if (workbook.SheetNames.length === 0) {
          alert("No sheets found in this Excel file.");
          setIsLoading(false);
          return;
        }

        const sheetName = workbook.SheetNames[1] || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const cellAddrs = Object.keys(sheet).filter((key) => !key.startsWith("!"));
        if (cellAddrs.length === 0) {
          alert("No readable cells found in this sheet.");
          setIsLoading(false);
          return;
        }

        const decoded = cellAddrs.map((a) => XLSX.utils.decode_cell(a));
        const maxRow = Math.max(...decoded.map((c) => c.r));
        const maxCol = Math.max(...decoded.map((c) => c.c));

        const matrix = [];
        for (let r = 0; r <= maxRow; r++) {
          const row = [];
          for (let c = 0; c <= maxCol; c++) {
            const cellAddr = XLSX.utils.encode_cell({ r, c });
            const cell = sheet[cellAddr];
            row.push(cell ? String(cell.v).trim() : "");
          }
          matrix.push(row);
        }

        const cleanRows = matrix.filter((row) =>
          row.some((cell) => cell && cell.trim() !== "")
        );

        if (cleanRows.length <= 1) {
          alert("No valid data found in this sheet.");
          setIsLoading(false);
          return;
        }

        const headers = cleanRows[0].map((h, i) => h || `Column ${i + 1}`);
        const dataRows = cleanRows.slice(1).map((row) => {
          const obj = {};
          headers.forEach((h, i) => (obj[h] = row[i] ?? ""));
          return obj;
        });

        setTempData({
          columns: headers,
          data: dataRows,
          sheetName: sheetName,
          rowCount: dataRows.length,
          colCount: headers.length
        });

        setIsLoading(false);
        setShowUploadModal(false);
        setShowSuccessModal(true);
      } catch (err) {
        console.error("❌ Excel parse error:", err);
        alert("Error reading the Excel file. Try re-exporting it as .xlsx again.");
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleShowPreview = () => {
    if (tempData) {
      setColumns(tempData.columns);
      setPreviewData(tempData.data);
      setSheetUsed(tempData.sheetName);
      setIsProcessed(false);
    }
    setShowSuccessModal(false);
  };

  const handleProcessAndStore = async () => {
    if (previewData.length === 0) {
      alert("⚠️ No data to process!");
      return;
    }

    setIsLoading(true);

    try {
     const payload = {
        type: "orders",
        data: previewData,
      };

      console.log("📤 Sending data to backend:", payload);

      const response = await addFlipkartOrders(payload);

      if (response?.success) {
        alert(`✅ ${response.insertedCount || previewData.length} rows processed and stored successfully!`);
        setIsProcessed(true);
      } else {
        alert(`❌ Upload failed: ${response?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
      alert("Something went wrong while processing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setIsLoading(false);
  };

  const handleNewUpload = () => {
    setPreviewData([]);
    setColumns([]);
    setSheetUsed("");
    setIsProcessed(false);
    setTempData(null);
    setSelectedFile(null);
    setShowUploadModal(true);
  };


 if (loading) {
  return (
    <Layout role={role}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          {/* Centered Logo */}
          <div className="flex justify-center">
            <Image
              alt="App Icon"
              src="/images/app-icon.png"
              width={140}
              height={60}
              className="object-contain"
            />
          </div>

          {/* Text Section */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
              DreamBook Publishing
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Please wait while we fetch your data...
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}


  return (
    <Layout role={role}>
      <div className="p-10 mt-16 lg:mt-0">
        {/* Header Section */}
        <div className="bg-white border-b rounded-lg border-gray-200   shadow-sm">
          <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Database className="h-8 w-8 text-indigo-600" />
                  Flipkart Data Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">Upload and manage your Flipkart orders and returns data</p>
              </div>
              
              {/* Latest Data Card */}
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 rounded-xl px-6 py-3 shadow-lg">
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5" />
                    <div>
                      <p className="text-xs font-medium opacity-90">Latest Data</p>
                      <p className="text-lg font-bold">
                        {loading ? "Loading..." : latestDate}
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleNewUpload}
                  className="bg-indigo-600 hover:bg-indigo-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
                >
                  <UploadCloud className="h-5 w-5" />
                  Upload New File
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:max-w-6xl  mx-auto px-4 sm:px-6  py-8">
          {previewData.length > 0 ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Rows</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{previewData.length}</p>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Columns</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{columns.length}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Sheet Name</p>
                      <p className="text-lg font-bold text-gray-900 mt-1 truncate">{sheetUsed}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Database className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-white">
                    <h2 className="text-xl font-bold">Data Preview</h2>
                    <p className="text-sm opacity-90 mt-1">Review your data before processing</p>
                  </div>
                  <button
                    onClick={handleProcessAndStore}
                    disabled={isLoading || isProcessed}
                    className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-semibold disabled:bg-gray-200 disabled:text-gray-500 hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    {isProcessed ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Processed & Stored
                      </>
                    ) : isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        <Database className="h-5 w-5" />
                        Process & Store
                      </>
                    )}
                  </button>
                </div>

                {/* Table */}
<div className="overflow-auto max-h-[600px]">
  <table className="w-full text-sm">
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-gray-200 bg-gray-100 sticky left-0 z-20">
          #
        </th>
        {columns.map((col, i) => (
          <th
            key={i}
            className="px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-gray-200 whitespace-nowrap"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {previewData.map((row, rIdx) => (
        <tr
          key={rIdx}
          className="hover:bg-indigo-50 transition-colors border-b border-gray-100"
        >
          <td className="px-4 py-3 text-gray-600 font-medium bg-gray-50 sticky left-0 z-10">
            {rIdx + 1}
          </td>
          {columns.map((col, cIdx) => (
            <td
              key={cIdx}
              // ✅ FIX: Check if column is a title to allow wrapping and set min-width
              className={`px-4 py-3 text-gray-700 ${
                col.toLowerCase().includes("title")
                  ? "whitespace-normal min-w-[300px] max-w-lg break-words"
                  : "whitespace-nowrap"
              }`}
            >
              {row[col] || "-"}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UploadCloud className="h-12 w-12 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">No Data Uploaded Yet</h2>
                <p className="text-gray-600 mb-6">
                  Get started by uploading your Flipkart Excel file. We support both orders and returns data.
                </p>
                <button
                  onClick={handleNewUpload}
                  className="bg-indigo-600 hover:bg-indigo-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 inline-flex items-center gap-2 hover:scale-105"
                >
                  <UploadCloud className="h-5 w-5" />
                  Upload Your First File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-in">
              <button
                onClick={handleCloseUploadModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <UploadCloud className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Upload Flipkart Excel</h2>
              </div>

              

              <label className="block border-3 border-dashed border-gray-300 rounded-xl px-6 py-12 text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-600 transition-all">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  disabled={isLoading}
                />
                <div className="flex flex-col items-center">
                  <div className="bg-indigo-100 p-4 rounded-full mb-4">
                    <FileSpreadsheet className="h-10 w-10 text-indigo-600" />
                  </div>
                  <span className="font-semibold text-gray-700 text-lg mb-2">
                    {selectedFile ? "✓ File Selected" : "Click to Upload Excel File"}
                  </span>
                  <span className="text-sm text-gray-500">Supports .xlsx and .xls files (max 5MB)</span>
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-3 font-medium bg-green-50 px-4 py-2 rounded-lg">
                      📄 {selectedFile.name}
                    </p>
                  )}
                  {isLoading && (
                    <div className="mt-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="text-sm text-indigo-600 mt-2">Reading file...</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && tempData && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center animate-in">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                File Uploaded Successfully!
              </h2>
              <p className="text-gray-600 mb-6">Your data has been loaded and is ready for preview</p>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Total Rows:</span>
                  <span className="text-gray-900 font-bold text-lg">{tempData.rowCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Total Columns:</span>
                  <span className="text-gray-900 font-bold text-lg">{tempData.colCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Sheet Name:</span>
                  <span className="text-gray-900 font-semibold truncate ml-2">{tempData.sheetName}</span>
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t border-green-200 truncate">
                  📄 {selectedFile?.name}
                </div>
              </div>
              
              <button
                onClick={handleShowPreview}
                className="w-full bg-indigo-600 hover:bg-indigo-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105"
              >
                Show Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const role = req.cookies._r || null;
  let id = null;

  if (req.cookies.user) {
    try {
      const user = JSON.parse(req.cookies.user);
      id = user._id || null;
    } catch (err) {
      console.error("Failed to parse user cookie:", err);
    }
  }

  if (!role) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { role, id } };
}
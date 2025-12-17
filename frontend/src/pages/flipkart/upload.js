import React, { useState } from "react";
import Layout from "@/layout/Layout";
import Button from "@/components/Button";
import { ChevronDown, UploadCloud } from "lucide-react";

const FlipkartData = () => {
  const [showModal, setShowModal] = useState(false);
  const uploadHistory = new Array(10).fill({
    name: "Flipkart data .csv",
    date: "10/12/2024"
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Flipkart data</h1>
          <Button className="bg-primary text-white px-6 py-2 whitespace-nowrap">
            Upload
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Upload history</h2>
            <Button variant="outline" className="flex items-center gap-1">
              This Month <ChevronDown size={16} />
            </Button>
          </div>

          <div className="divide-y border rounded-md">
            <div className="grid grid-cols-2 font-semibold p-3">
              <span>File name</span>
              <span className="text-right">Uploaded date</span>
            </div>
            {uploadHistory.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-2 p-3 hover:bg-gray-50 text-sm"
              >
                <span>{item.name}</span>
                <span className="text-right">{item.date}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Button variant="outline">Load more</Button>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-semibold mb-4">Upload your files</h2>
              <div className="space-y-4">
                {[1, 2].map((box) => (
                  <label
                    key={box}
                    className="block border rounded-xl px-6 py-8 text-center cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                    />
                    <div className="flex flex-col items-center">
                      <UploadCloud className="h-8 w-8 mb-2 text-gray-500" />
                      <span className="font-medium text-gray-700">
                        Upload Flipkart Product Listing Data<span className="text-red-500">*</span>
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        ( Acceptable formats: csv only Max 2mb )
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <Button className="bg-primary text-white px-6 py-2 whitespace-nowrap">Upload</Button>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FlipkartData;

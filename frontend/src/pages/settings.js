import Button from '@/components/Button'
import Input from '@/components/Input'
import Layout from '@/layout/Layout'
import { updateProfile } from '@/services/APIs/onBoarding'
import { setUser } from '@/services/firebase-services/cookies'
import { permissionHandler } from '@/Utilities/permissions'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Index({ role, user }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handler = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    const name = formData.get("name");
    const account_holder = formData.get("account_holder");
    const password = formData.get("password");
    const ifsc = formData.get("ifsc");
    const account_number = formData.get("account_number");
    const bank = formData.get("bank");

    // build payload, only include password if entered
    const payload = {
      accountHolderName: account_holder,
      accountNumber: account_number,
      bankName: bank,
      ifscCode: ifsc,
      name: name,
      ...(password ? { password } : {}) // only update password if user typed it
    };

    const response = await updateProfile(payload, user._id,role);

    console.log("update profile response", response);
    if (response.status) {
      setUser({ ...user, ...response.data }); // merge old and new data
    }
    setLoading(false);
  };

  return (
    <Layout role={role}>
      <div className="p-10 mt-16 lg:mt-0">

        <div className="w-full flex flex-wrap items-center">
          <Button
            variant="white-border"
            className="w-fit mr-3 items-center"
            onClick={() => router.back()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14 8C14 8.27614 13.7761 8.5 13.5 8.5L2.5 8.5C2.22386 8.5 2 8.27614 2 8C2 7.72386 2.22386 7.5 2.5 7.5L13.5 7.5C13.7761 7.5 14 7.72386 14 8Z"
                fill="#8C8D8C"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.35355 3.14645C7.54882 3.34171 7.54882 3.65829 7.35355 3.85355L3.20711 8L7.35355 12.1464C7.54881 12.3417 7.54881 12.6583 7.35355 12.8536C7.15829 13.0488 6.84171 13.0488 6.64645 12.8536L2.14645 8.35355C1.95118 8.15829 1.95118 7.84171 2.14645 7.64645L6.64645 3.14645C6.84171 2.95118 7.15829 2.95118 7.35355 3.14645Z"
                fill="#8C8D8C"
              />
            </svg>
          </Button>
          <h1 className="text-black-4 text-3xl font-semibold">Settings</h1>
        </div>

        <form
          onSubmit={handler}
          className="w-full bg-[#FFF] mt-5 rounded-xl p-5 flex-wrap"
        >
          <div className="w-full flex flex-wrap mb-5">
            <label className="w-full text-[#555555] font-medium mb-2 text-sm">
              Name
            </label>
            <Input
              type="text"
              placeholder="Enter author name"
              name="name"
              defaultValue={user && user.name}
            />
          </div>

          <div className="w-full flex flex-wrap mb-5">
            <label className="w-full text-[#555555] font-medium mb-2 text-sm">
              Email
            </label>
            <Input
              type="email"
              readOnly={true}
              placeholder="Enter author email"
              defaultValue={user && user.email}
            />
          </div>

          <div className="w-full flex flex-wrap mb-5">
            <label className="w-full text-[#555555] font-medium mb-2 text-sm">
              Password
            </label>
            <Input
              type="password"
              name="password"
              placeholder="Enter new password (leave blank to keep current)"
            />
          </div>

          {user && user.role === "author" && (
            <div className="w-full grid grid-cols-2 gap-x-4">
              <div className="w-full flex flex-wrap mb-5">
                <label className="w-full text-[#555555] font-medium mb-2 text-sm">
                  Account Holder Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter Account Holder Name"
                  name="account_holder"
                  defaultValue={user && user.accountHolderName}
                />
              </div>
              <div className="w-full flex flex-wrap mb-5">
                <label className="w-full text-[#555555] font-medium mb-2 text-sm">
                  Account Number
                </label>
                <Input
                  type="text"
                  placeholder="Enter Account Number"
                  name="account_number"
                  defaultValue={user && user.accountNumber}
                />
              </div>
              <div className="w-full flex flex-wrap mb-5">
                <label className="w-full text-[#555555] font-medium mb-2 text-sm">
                  Bank Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter Bank Name"
                  name="bank"
                  defaultValue={user && user.bankName}
                />
              </div>
              <div className="w-full flex flex-wrap mb-5">
                <label className="w-full text-[#555555] font-medium mb-2 text-sm">
                  IFSC Code
                </label>
                <Input
                  type="text"
                  placeholder="IFSC Code"
                  name="ifsc"
                  defaultValue={user && user.ifscCode}
                />
              </div>
            </div>
          )}

          <div className="w-full flex flex-wrap justify-end">
            <Button
              type="submit"
              variant="primary"
              className="w-fit"
              loading={loading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const role = req.cookies._r || null;
  const user = req.cookies.user || null;
  if (!permissionHandler("settings", role)) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  return {
    props: {
      role,
      user: user ? JSON.parse(user) : null,
    },
  };
}

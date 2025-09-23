import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <section className="max-w-7xl mx-auto border-t px-4">
      <div className="flex justify-center py-8">
        <p className="text-primary tracking-tight ">
          Crafted with ❤️ by{" "}
          <Link target="_blank" href={"https://rishiyadav.me"} className="font-bold text-blue-500 hover:underline">
            Rishi Yadav
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Footer;

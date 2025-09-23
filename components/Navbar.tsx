import React from "react";
import { AdvancedModeToggle } from './ui/theme-button';
import Image from "next/image";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center py-4">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Webkitter Logo" width={40} height={40} />
        <div className="flex flex-col gap-4">
          <span className="tracking-tighter text-3xl font-extrabold text-primary flex gap-2 items-center">
            Webkitter{" "}
          
          </span>
        </div>
      </div>
      <AdvancedModeToggle />
    </nav>
  );
};

export default Navbar;

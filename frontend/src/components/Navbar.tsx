import React, { useState } from 'react';
import { Menu, X, Recycle, LogOut, User as UserIcon } from 'lucide-react';
import type { User } from '../types/index.js';

interface NavbarProps {
  user: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onRegisterClick, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="w-full w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <Recycle className="h-5 w-5" />
            </div>
            <span className="font-sans text-xl font-bold tracking-tight text-zinc-900">
              TexCycle <span className="text-emerald-600">AI</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#hero" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">
              Home
            </a>
            <a href="#marketplace" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">
              Marketplace
            </a>
            <a href="#why-choose" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">
              About
            </a>
            <a href="#circularity" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">
              Circularity
            </a>
            <a href="#testimonials" className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">
              Testimonials
            </a>
          </div>

          {/* Desktop CTAs / User Auth Info */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                  <UserIcon className="h-4 w-4" />
                  <span>{user.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={onRegisterClick}
                  className="rounded-full bg-zinc-950 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 duration-200 shadow-sm"
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-b border-gray-100 bg-white px-4 py-4 md:hidden animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col gap-3">
            <a
              href="#hero"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600"
            >
              Home
            </a>
            <a
              href="#marketplace"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600"
            >
              Marketplace
            </a>
            <a
              href="#why-choose"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600"
            >
              About
            </a>
            <a
              href="#circularity"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600"
            >
              Circularity
            </a>
            <a
              href="#testimonials"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 text-base font-medium text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600"
            >
              Testimonials
            </a>
            <hr className="my-2 border-gray-100" />
            {user ? (
              <div className="flex flex-col gap-3 px-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <UserIcon className="h-4 w-4" />
                  <span>Logged in as: {user.name}</span>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <button
                  onClick={() => {
                    onLoginClick();
                    setIsOpen(false);
                  }}
                  className="rounded-md border border-gray-200 py-2.5 text-center text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    onRegisterClick();
                    setIsOpen(false);
                  }}
                  className="rounded-md bg-zinc-950 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

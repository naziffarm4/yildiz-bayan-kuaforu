"use client";

import React, { createContext, useContext } from "react";
import type {
  SalonInfo,
  PageTexts,
  BookingRules,
  SpecialDay,
  CustomerReview,
  GalleryItem,
} from "@yildiz/types";
import {
  SALON_INFO,
  DEFAULT_PAGE_TEXTS,
  DEFAULT_BOOKING_RULES,
  DEFAULT_SPECIAL_DAYS,
} from "./site-defaults";
import { useAppStore } from "@/stores/app-store";

export interface ContentContextType {
  isLoading: boolean;
  salonInfo: SalonInfo;
  updateSalonInfo: (patch: Partial<SalonInfo>) => void;

  pageTexts: PageTexts;
  updatePageTexts: (patch: Partial<PageTexts> | ((prev: PageTexts) => PageTexts)) => void;

  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  addGalleryItem: (item: (Omit<GalleryItem, "id" | "begeniSayisi"> & { begeniSayisi?: number; id?: string }) | GalleryItem) => void;
  updateGalleryItem: (id: string, updates: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryItem: (id: string) => void;

  reviews: CustomerReview[];
  setReviews: React.Dispatch<React.SetStateAction<CustomerReview[]>>;
  addReview: (review: (Omit<CustomerReview, "id" | "tarih"> & { tarih?: string; id?: string }) | CustomerReview) => void;
  deleteReview: (id: string) => void;

  bookingRules: BookingRules;
  updateBookingRules: (patch: Partial<BookingRules>) => void;

  specialDays: SpecialDay[];
  addSpecialDay: (day: Omit<SpecialDay, "id">) => void;
  deleteSpecialDay: (id: string) => void;

  resetAllContent: () => void;
}

const ContentContext = createContext<ContentContextType | null>(null);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isInitialLoaded = useAppStore((s) => s.isInitialLoaded);
  const salonInfo = useAppStore((s) => s.salonInfo);
  const pageTexts = useAppStore((s) => s.pageTexts);
  const gallery = useAppStore((s) => s.gallery);
  const reviews = useAppStore((s) => s.reviews);
  const bookingRules = useAppStore((s) => s.bookingRules);
  const specialDays = useAppStore((s) => s.specialDays);

  const updateSalonInfo = useAppStore((s) => s.updateSalonInfo);
  const updatePageTexts = useAppStore((s) => s.updatePageTexts);
  const updateBookingRules = useAppStore((s) => s.updateBookingRules);
  const addSpecialDay = useAppStore((s) => s.addSpecialDay);
  const deleteSpecialDay = useAppStore((s) => s.deleteSpecialDay);

  const addGalleryItem = useAppStore((s) => s.addGalleryItem);
  const updateGalleryItem = useAppStore((s) => s.updateGalleryItem);
  const deleteGalleryItem = useAppStore((s) => s.deleteGalleryItem);

  const addCustomerReview = useAppStore((s) => s.addCustomerReview);
  const deleteCustomerReview = useAppStore((s) => s.deleteCustomerReview);

  const setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>> = (action) => {
    const next = typeof action === "function" ? action(useAppStore.getState().gallery) : action;
    useAppStore.setState({ gallery: next });
  };

  const setReviews: React.Dispatch<React.SetStateAction<CustomerReview[]>> = (action) => {
    const next = typeof action === "function" ? action(useAppStore.getState().reviews) : action;
    useAppStore.setState({ reviews: next });
  };

  const addReview = (review: (Omit<CustomerReview, "id" | "tarih"> & { tarih?: string; id?: string }) | CustomerReview) => {
    const id = (review as CustomerReview).id || `rev-${Date.now()}`;
    const todayStr =
      review.tarih ||
      new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date());

    const item: CustomerReview = {
      id,
      tarih: todayStr,
      ...review,
    };
    addCustomerReview(item);
  };

  const deleteReview = (id: string) => {
    deleteCustomerReview(id);
  };

  const resetAllContent = () => {
    useAppStore.setState({
      salonInfo: SALON_INFO,
      pageTexts: DEFAULT_PAGE_TEXTS,
      gallery: [],
      reviews: [],
      bookingRules: DEFAULT_BOOKING_RULES,
      specialDays: DEFAULT_SPECIAL_DAYS,
    });
  };

  return (
    <ContentContext.Provider
      value={{
        isLoading: !isInitialLoaded,
        salonInfo,
        updateSalonInfo,
        pageTexts,
        updatePageTexts,
        gallery,
        setGallery,
        addGalleryItem: (item) => {
          const id = (item as GalleryItem).id || `gal-${Date.now()}`;
          addGalleryItem({ id, begeniSayisi: 0, ...item } as GalleryItem);
        },
        updateGalleryItem,
        deleteGalleryItem,
        reviews,
        setReviews,
        addReview,
        deleteReview,
        bookingRules,
        updateBookingRules,
        specialDays,
        addSpecialDay,
        deleteSpecialDay,
        resetAllContent,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
};

import * as ToastPrimitive from "@radix-ui/react-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Toast({ message, open, setOpen }) {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <AnimatePresence>
        {open && (
          <ToastPrimitive.Root
            open={open}
            onOpenChange={setOpen}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                // background: "#252529",
                backgroundColor: "#ffde00",
                // color: "#fff",
                color: "#7f5af0",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                maxWidth: "300px",
                fontWeight: 600,
                fontFamily: "Nunito, sans-serif",
              }}
            >
              {message}
            </motion.div>
          </ToastPrimitive.Root>
        )}
      </AnimatePresence>

      <ToastPrimitive.Viewport
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: 320,
          maxWidth: "100%",
          zIndex: 9999,
        }}
      />
    </ToastPrimitive.Provider>
  );
}

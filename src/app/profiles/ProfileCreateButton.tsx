"use client";

import { useState } from "react";
import ProfileCreateModal from "./ProfileCreateModal";

type Props = { onSuccess: () => void };

export default function ProfileCreateButton({ onSuccess }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        생성
      </button>
      {showModal && (
        <ProfileCreateModal
          onClose={() => setShowModal(false)}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}

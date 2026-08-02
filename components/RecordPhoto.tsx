"use client";

import { useEffect, useState } from "react";
import { loadPhoto } from "@/lib/photos";
import styles from "./RecordPhoto.module.css";

type Props = {
  recordId: string;
};

export default function RecordPhoto({ recordId }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    loadPhoto(recordId).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [recordId]);

  if (!url) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="完了時に撮影した写真" className={styles.photo} />
  );
}

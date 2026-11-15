import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchDefectImage, type DefectImage } from "../../services/defects";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

// Defect screenshots (6b-2). They're served only with the login token, so each
// one is downloaded, shown from memory (an object URL) and released when it's
// no longer on screen.

export type ImageSource = { projectId: number; requirementNumber: number; defectNumber: number };

// An image opened full size: its object URL and file name
export type OpenImage = { url: string; name: string };

const thumbClasses = "h-12 w-16 rounded-lg border border-gray-200 bg-track/60 object-cover";

// Object URL of a saved screenshot; null while loading, "" if it failed
function useSavedImageUrl(source: ImageSource, imageId: number) {
  const [url, setUrl] = useState<string | null>(null);
  const { projectId, requirementNumber, defectNumber } = source;

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    fetchDefectImage(projectId, requirementNumber, defectNumber, imageId)
      .then((blob) => {
        if (cancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((error) => {
        console.error("Screenshot failed to load:", error);

        if (!cancelled) {
          setUrl("");
        }
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [projectId, requirementNumber, defectNumber, imageId]);

  return url;
}

type ThumbProps = {
  url: string | null;
  name: string;
  onOpen: (image: OpenImage) => void;
};

// A small clickable preview (opens the image full size)
export function Thumb({ url, name, onOpen }: ThumbProps) {
  const { t } = useTranslation();

  if (url === null) {
    return <span className={`${thumbClasses} block animate-pulse`} aria-label={name} />;
  }

  if (url === "") {
    return (
      <span
        className={`${thumbClasses} flex items-center justify-center text-[0.625rem] text-gray-400`}
        title={t("defects.errImageLoad", { name })}
      >
        ?
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen({ url, name })}
      aria-label={t("defects.viewImage", { name })}
      className="rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-soft"
    >
      <img src={url} alt={name} className={thumbClasses} />
    </button>
  );
}

// A saved screenshot's preview
export function SavedThumb({
  source,
  image,
  onOpen,
}: {
  source: ImageSource;
  image: DefectImage;
  onOpen: (image: OpenImage) => void;
}) {
  const url = useSavedImageUrl(source, image.id);

  return <Thumb url={url} name={image.fileName} onOpen={onOpen} />;
}

// The full-size view, with the file name and Close
export function ImageViewer({ image, onClose }: { image: OpenImage | null; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <Modal
      open={image !== null}
      onClose={onClose}
      title={image?.name ?? ""}
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t("defects.closeImage")}
        </Button>
      }
    >
      {image && (
        <img
          src={image.url}
          alt={image.name}
          className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl border border-gray-200"
        />
      )}
    </Modal>
  );
}

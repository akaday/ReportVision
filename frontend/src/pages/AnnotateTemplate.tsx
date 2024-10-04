import { UploadHeader } from "../components/Header.tsx";
import { Divider } from "../components/Divider.tsx";
import { Stepper } from "../components/Stepper.tsx";
import { AnnotateStep } from "../utils/constants.ts";
import { useFiles } from "../contexts/FilesContext.tsx";
import * as pdfjsLib from "pdfjs-dist";
import { Accordion, AccordionItemProps } from "@trussworks/react-uswds";
import { MultiImageAnnotator } from "../components/ImageAnnotator.tsx";
import { useNavigate } from "react-router-dom";
import { LABELS } from "../constants/labels";
import { Icon } from "@trussworks/react-uswds";
import { useEffect, useState } from "react";

import "./AnnotateTemplate.scss";
import { useAnnotationContext } from "../contexts/AnnotationContext.tsx";
import { convertBase64SvgToBase64Png } from "../utils/utils.ts";

interface LabelItem {
  name: string;
  required: boolean;
  color: string;
  subItems?: LabelItem[];
}

interface LabelCategory {
  title: string;
  items: LabelItem[];
}

const AnnotateTemplate: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const navigate = useNavigate();

  const { files } = useFiles();
  const {
    setSelectedField,
    annotator,
    setFields,
    fields,
    setAnnotatedImages,
    index,
    setIndex,
  } = useAnnotationContext();
  const pdfFile = files[0];

  useEffect(() => {
    if (!(pdfFile instanceof File)) {
      console.error("pdfFile is not a valid File object");
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const convertPdfToImages = async (file: File) => {
      const images: Array<string> = [];
      const data = URL.createObjectURL(file);

      const pdf = await pdfjsLib.getDocument(data).promise;
      const canvas = document.createElement("canvas");
      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 1 });
        const context = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport: viewport })
          .promise;
        images.push(canvas.toDataURL());
      }
      canvas.remove();
      URL.revokeObjectURL(data);
      return images;
    };

    convertPdfToImages(pdfFile).then((imgs) => {
      setImages(imgs);
      localStorage.setItem("images", JSON.stringify(imgs));
    });
  }, [files, pdfFile]);
  useEffect(() => {
    const getImage = async () => {
      const localImages = await JSON.parse(
        localStorage.getItem("images") || "[]"
      );
      if (localImages.length > 0) {
        setImages(localImages);
      }
    };
    getImage();
  }, []);
  const renderLabelContent = (category: LabelCategory): JSX.Element => (
    <ul className="usa-list usa-list--unstyled">
      {category.items.map((item, idx) => (
        <li
          key={item.name}
          className="display-flex flex-justify space-between flex-align-center padding-y-1 label-container margin-0"
          onClick={() => {
            setSelectedField({

                name: item.name,
                id: String(idx + 1),
                color: item.color.slice(0, 7),
            });
            let tempFields = [...fields];
            if (fields.length === 0) {
              tempFields.unshift(new Set<string>());
              setFields([new Set()]);
            } else if (fields.length < index + 1) {
              tempFields = [...tempFields, new Set()];
              setFields(tempFields);
            }
            if (!tempFields[index].has(item.name)) {
              annotator!.drawRectangle();
              tempFields[index].add(item.name);
              setFields(tempFields);
            } else {
              annotator!.edit(idx + 1);
            }
          }}
        >
          <div className="display-flex flex-align-center">
            <div
              className="display-flex flex-align-center bg-primary padding-1px"
              style={{ backgroundColor: item.color || "#007BFF" }}
            >
              <Icon.TextFields color="white" />
            </div>
            <span className="margin-left-1 text-normal">{item.name}</span>
          </div>
        </li>
      ))}
    </ul>
  );
  const accordionItems: AccordionItemProps[] = Object.entries(LABELS).map(
    ([key, category]) => ({
      title: category.title,
      content: renderLabelContent(category),
      expanded: false,
      id: key,
      headingLevel: "h3",
    })
  );

  const handleSubmit = async () => {
    annotator!.stop();
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    try {
      const tempImages: string[] = [];
      // Use a for loop to handle asynchronous behavior in sequence
      for (let idx = 0; idx < images.length; idx++) {
        setIndex(idx);
        const svg = document.getElementsByTagName('svg')[document.getElementsByTagName('svg').length - 1]
        const svgStr = new XMLSerializer().serializeToString(svg);

        const base64 = window.btoa(svgStr) // Convert the canvas to Base64

        const png = await convertBase64SvgToBase64Png(base64, Number(svg.getAttribute('width')) || 0, Number(svg.getAttribute('height')) || 0);
        tempImages.unshift(`data:image/png;base64,${png}`);
        await delay(1500); // Wait for 1 second before moving to the next index
      }
      // Update state, save the images, or navigate, as required
      setAnnotatedImages([...tempImages]);
      navigate("/new-template/save");
      setIndex(0)
    } catch (err) {
      console.error("Error taking screenshot", err);
    }
  };

  return (
    <div className="display-flex flex-column flex-justify-start width-full height-full padding-1 padding-top-2">
      <UploadHeader
        title="Annotate new template"
        onBack={() => navigate("/new-template/upload")}
        onSubmit={handleSubmit}
      />
      <Divider margin="0px" />
      <div className="display-flex flex-justify-center padding-top-4">
        <Stepper currentStep={AnnotateStep.Annotate} />
      </div>
      <Divider margin="0px" />
      <div className="grid-row  flex-1 overflow-hidden">
        <div className="grid-col-3 flex-3 height-full overflow-y-auto">
          <h2>Segment and label</h2>
          <p className="text-base">
            Annotate by segmenting and labeling your new template.
          </p>
          <Divider margin="0px" />
          <Accordion items={accordionItems} />
        </div>
        <div
          id="img-annotator-container"
          className="grid-col-9 height-full overflow-y-auto bg-base-lightest display-flex flex-justify-center"
        >
          {images.length > 0 ? (
            <MultiImageAnnotator images={images} categories={[]} />
          ) : (
            <div className="display-flex flex-justify-center flex-align-center height-full">
              No image File available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnotateTemplate;
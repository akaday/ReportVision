import React, { ChangeEvent, useEffect, useId, useState } from "react";
import { Button, Select } from "@trussworks/react-uswds";
import { useFiles } from "../contexts/FilesContext";
import { useNavigate } from "react-router-dom";
import image from "../assets/green_check.svg";

import * as pdfjsLib from "pdfjs-dist";

import './ExtractUploadFile.scss';
import { FileInput } from "./FileInput/file-input";



pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;


interface ExtractUploadFileProps {
  onUploadComplete: (isComplete: boolean) => void;
}

interface IFilesObj {
  files: File[];
}

interface Template {
  name: string;
  description: string;
  pages: {
    image: string;
    fieldNames: string[];
  }[];
}

export const ExtractUploadFile: React.FC<ExtractUploadFileProps> = ({
  onUploadComplete,
}) => {
  const id = useId();
  const { addFile, clearFiles, files, setSelectedTemplates, selectedTemplates } = useFiles();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isUploadComplete, setIsUploadComplete] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File[]>([]);
  const loadTemplatesTestData = () => {
    const sampleTemplates: Template[] = [
      {
        name: "Test Template COVID",
        description: "This is the first sample template.",
        pages: [
          {
            image: "base64encodedimage1",
            fieldNames: ["patient_name", "patient_dob"],
          },
        ],
      },
      {
        name: "Test Template Syph",
        description: "This is the second sample template.",
        pages: [
          {
            image: "base64encodedimage2",
            fieldNames: ["patient_name", "address"],
          },
        ],
      },
    ];

    setTemplates(sampleTemplates);
  };

  useEffect(() => {
    // Load templates from local storage, and if none are found, load test data
    const loadTemplatesFromLocalStorage = () => {
      const storedTemplates = localStorage.getItem("templates");
      if (storedTemplates) {
        const parsedTemplates = JSON.parse(storedTemplates);
        setTemplates(parsedTemplates);
      } else {
        loadTemplatesTestData();
      }
    };
    loadTemplatesFromLocalStorage();

    return () => clearFiles();

  }, []);
  const simulateFileUpload = async(files: File[]) => {
    onUploadComplete(true);
    files.forEach(file => addFile(file));
    try {
      const convertedFiles = await Promise.all(files.map(async (file) => {
        // the obj pdfjsLib is being really stubbon on github actions and failing to load the worker
        const convertPdfToImages = async (file: File) => {
          const localImages: string[] = [];
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
              localImages.push(canvas.toDataURL());
          }
          canvas.remove();
          URL.revokeObjectURL(data);
          return localImages
        }
        const images =  await convertPdfToImages(file); 
        return {
          file: file.name,
          images: images.map((image) => image),
        };
      }));
      localStorage.setItem('extracted_images_uploaded', JSON.stringify(convertedFiles));
    } catch (e) {
      console.error(e);
    }
 
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setUploadedFile(files);
      const filesObj: IFilesObj = { files };
      localStorage.setItem("files", JSON.stringify(filesObj));
      simulateFileUpload(files);
      onUploadComplete(false);
      if (!isUploadComplete && uploadedFile.length > 0) {
        setIsUploadComplete(true);
      }
    }
  };

  const handleSelect = (templateName: string, fileName: string, index: number) => {
    setSelectedTemplates({ templateName, fileName }, index);
  }
  return (
    <div className="display-flex flex-column flex-align-start flex-justify-start height-full width-full padding-2 bg-primary-lighter">
      <div className="extract-upload-header">
        <h2>
          Upload new image or PDF to extract data from
        </h2>
        <p>
          You can import files individually or in bulk for data extraction as either as PDFs or images. PDFs will automatically be converted to images upon import.
        </p>
        <p className="helper-text">
          Select one or more files
        </p>
      </div>

      <div
        data-testid="dashed-container"
        className={`display-flex flex-column margin-top-205 flex-justify-center flex-align-center bg-white dashed-container ${uploadedFile.length > 0 ? "dashed-container-uploaded" : ""}`}
      >
      {
        uploadedFile.length > 0 && (
          <div className="display-flex flex-column flex-justify-center flex-align-center select-container width-full">
            <div className="select-label-container">
              <label
                htmlFor="template-select"
                className="usa-label margin-left-2"
                style={{ alignSelf: "flex-start" }}
              >
                {uploadedFile.length} file(s) selected
              </label>
              {
                !isUploadComplete && (
                  <FileInput
                    multiple
                    onChange={handleChange}
                    id={`file-input-multiple-${id}-2`}
                    className="padding-bottom-1"
                    name="file-input-multiple"
                    chooseText="Change file(s)"
                    dragText=" "
                  />
                )
              }

            </div>
            <div className="display-flex flex-column width-full height-full margin-bottom-2 margin-top-1" style={{ justifyContent: 'space-between'}}>

              {
                files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="display-flex width-full height-8">
                    <div className="display-flex width-full height-full flex-align-center">
                    <img
                        className="margin-left-2"
                        height='28px'
                        width='28px'
                        data-testid="extracted-image"
                        src={image}
                        alt="404"
                      />    
                      <span className="margin-left-1 text-ink">{files.length > 0 ? file.name : 'default name'}</span>
                  </div> 
                    <Select
                    id="template-select"
                    key={index}
                    className="template-select margin-right-2"
                    name="template"
                    value={selectedTemplates[index]?.templateName || "Select template"}
                    onChange={(e) => handleSelect(e.target.value, file.name, index)}
                  >
                    {templates.length === 0 ? (
                      <option value="">No templates available</option>
                    ) : (
                      [(<option key="default-opt" value={"Select temlate"}>
                        Select template
                      </option>), ...templates.map((tpl, index) => (
                        <option key={index} value={tpl.name}>
                          {tpl.name}
                        </option>
                      ))]
                    )}
                  </Select>
                </div>
                ))
              }

            </div>
          </div>
        )
      }  

        {uploadedFile.length === 0 && (
          <>
            <div
              className="display-flex flex-column flex-align-center flex-justify-center margin-bottom-1"
              style={{ width: "80%" }}
            >
              <FileInput
                multiple
                onChange={handleChange}
                id={`file-input-multiple-${id}-1`}
                className="padding-bottom-1 extract-file-input"
                name="file-input-multiple"
                chooseText=" "
                dragText="Drag file(s) here or choose from folder"
              />
            </div>
          </>
        )}
      </div>
      <div className="display-flex margin-top-3">
        <Button
          type="button"
          outline
          className="margin-right-1"
          onClick={() => navigate('/')}
        >
          Cancel Import
        </Button>
        <Button
          type="button"
          className="usa-button display-flex flex-align-center margin-left-auto margin-right-auto"
          disabled={uploadedFile.length === 0 || selectedTemplates.length === 0}
          onClick={() => navigate("/extract/process")}
        >
          Extract Data
        </Button>
      </div>
    </div>
  );
};

export default ExtractUploadFile;

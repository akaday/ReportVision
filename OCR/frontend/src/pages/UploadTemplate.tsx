import { Divider } from "../componets/Divider"
import { UploadHeader } from "../componets/Header"
import { Stepper } from "../componets/Stepper"
import { Uploadfile } from "../componets/UploadFile"
import { AnnotateStep } from "../utils/constants"

export const UploadTemplate = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', width: '100%', height: '100%', padding: '16px 8px, 8px, 8px' }}>
            <UploadHeader onBack={() => {}} onSubmit={() => {}} />
            <Divider margin="0px" />
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '32px'}}>
                <Stepper currentStep={AnnotateStep.Upload} />
            </div>
            <Divider margin="0px" />
            <Uploadfile />
        </div>
    )
}
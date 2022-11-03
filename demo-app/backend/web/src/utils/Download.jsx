import FileSaver from 'file-saver';

export default function (content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    FileSaver.saveAs(blob, fileName);
}
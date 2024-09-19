import os
from saxonche import *

def transform():
    index = int(os.environ.get("BATCH_TASK_INDEX", "-1"))

    if index == -1:
        in_file = "small.xml"
        out_file = ""
    else:
        file_index = str(index+1).zfill(4)
        in_file = "/mnt/disks/<your-project-id>-datastore/pubmed24n" + file_index + ".xml"
        out_file = "/mnt/disks/<your-project-id>-jsonl/pubmed24n" + file_index + ".jsonl"
    print(in_file)
    print(out_file)

    with PySaxonProcessor(license=False) as proc:
        xsltproc = proc.new_xslt30_processor()
        document = proc.parse_xml(xml_file_name=in_file)
        executable = xsltproc.compile_stylesheet(stylesheet_file="jsonl-ify.xsl")
        output = executable.transform_to_string(xdm_node=document)

        if out_file == "":
            print(output)
        else:
            with open(out_file, "w") as f:
                f.write(output)
        
        lines = output.count("\n")
        print(f"Wrote {lines} lines to {out_file}")


if __name__ == "__main__":
    transform()

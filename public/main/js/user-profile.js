//country code

var phone_number = window.intlTelInput(document.querySelector("#phone"), {
  separateDialCode: true,
  preferredCountries:["in"],
  hiddenInput: "full",
  utilsScript: "//cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.3/js/utils.js"
});

$("form").submit(function() {
  var full_number = phone_number.getNumber(intlTelInputUtils.numberFormat.E164);
$("input[name='phone_number[full]'").val(full_number);
});
 

// user-profile-crop

    function fileValidation2() {
        const imagebox = document.getElementById('image-box')
        const crop_btn = document.getElementById('crop-btn')
        var fileInput = document.getElementById('file2');
        

        var filePath = fileInput.value;
        var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
        if (!allowedExtensions.exec(filePath)) {
            alert('Please upload file having extensions .jpeg only.');
            fileInput.value = '';
            return false;
        } else {
            //Image preview
            const img_data = fileInput.files[0]
            const url = URL.createObjectURL(img_data)

            imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`

            const image = document.getElementById('image')

            document.getElementById('image-box').style.display = 'block'
            document.getElementById('crop-btn').style.display = 'block'

           
            const cropper = new Cropper(image, {
                autoCropArea: 1,
                viewMode: 1,
                scalable: false,
                zoomable: false,
                movable: false,
                aspectRatio: 16 / 19,
              //  preview: '.preview',
                minCropBoxWidth: 180,
                minCropBoxHeight: 240,
            })

            crop_btn.addEventListener('click', () => {
                cropper.getCroppedCanvas().toBlob((blob) => {

                    let fileInputElement = document.getElementById('file2');
                    let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
                    let container = new DataTransfer();
                   
                    container.items.add(file);
                     const img = container.files[0]
                     var url =URL.createObjectURL(img)                    
                     fileInputElement.files = container.files;
                     document.getElementById('imgview1').src=url
                     document.getElementById('imgview2').src=url

                    document.getElementById('image-box').style.display = 'none'
                    document.getElementById('crop-btn').style.display = 'none'

                });
            });
        }
    }

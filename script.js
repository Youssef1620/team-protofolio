
        // شريط التمرير
        window.onscroll = function() {
            let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            let scrolled = (winScroll / height) * 100;
            document.getElementById("progress-bar").style.width = scrolled + "%";
        };

        // المودال (نافذة المشاريع)
        function openModal(title, desc) {
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalDesc').innerText = desc;
            document.getElementById('projectModal').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('projectModal').style.display = 'none';
        }

        // إغلاق المودال عند الضغط خارجه
        window.onclick = function(event) {
            let modal = document.getElementById('projectModal');
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

        // تفاعلات النموذج (تحويل البيانات لرسالة جاهزة)
        function generateBrief() {
            let name = document.getElementById('userName').value || 'عميلنا العزيز';
            let type = document.getElementById('workType').value;
            let contact = document.getElementById('userContact').value || 'لم يُحدد';
            let idea = document.getElementById('userIdea').value || 'لم تُحدد الفكرة بعد';

            document.getElementById('displayName').innerText = name.split(' ')[0];

            let finalMessage = `طلب جديد - فكرة FIKRA<br>
الاسم: ${name}<br>
التواصل: ${contact}<br>
النوع: ${type}<br>
الفكرة: ${idea}`;

            document.getElementById('finalText').innerHTML = finalMessage;
            
            document.getElementById('form-view').style.display = 'none';
            document.getElementById('result-view').style.display = 'block';
        }

        function resetForm() {
            document.getElementById('userName').value = '';
            document.getElementById('userContact').value = '';
            document.getElementById('userIdea').value = '';
            
            document.getElementById('result-view').style.display = 'none';
            document.getElementById('form-view').style.display = 'grid';
        }

        function copyBrief() {
            let textToCopy = document.getElementById('finalText').innerText;
            
            let tempInput = document.createElement("textarea");
            tempInput.value = textToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);
            
            alert("تم نسخ الرسالة بنجاح! تقدر تبعتها دلوقتي.");
        }
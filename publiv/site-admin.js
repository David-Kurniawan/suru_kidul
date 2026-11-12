(function () {
  const dataKey = 'suruKidulSiteData';
  const infographicKey = 'suruKidulInfographicData';
  const galleryKey = 'suruKidulGalleryUploads';
  const sessionKey = 'suruKidulAdminSession';
  const adminUsername = 'Dusunsurukidul';
  const defaultStats = {
    population: 311,
    rt: 4,
    male: 167,
    female: 144
  };
  const maxPhotos = 12;
  const imageMaxEdge = 1000;
  const imageQuality = 0.78;
  let sharedPhotos = [];
  let hasReceivedSharedPhotos = false;
  let unsubscribeSharedPhotos = null;
  const defaultInfographic = {
    age: [
      { id: 'age_0_10', label: '0-10', tableLabel: '0-10', value: 28 },
      { id: 'age_11_20', label: '11-20', tableLabel: '11-20', value: 44 },
      { id: 'age_21_30', label: '21-30', tableLabel: '21-30', value: 46 },
      { id: 'age_31_40', label: '31-40', tableLabel: '31-40', value: 43 },
      { id: 'age_41_50', label: '41-50', tableLabel: '41-50', value: 41 },
      { id: 'age_51_60', label: '51-60', tableLabel: '51-60', value: 46 },
      { id: 'age_61_70', label: '61-70', tableLabel: '61-70', value: 31 },
      { id: 'age_71_80', label: '71-80', tableLabel: '71-80', value: 13 },
      { id: 'age_81_90', label: '81-90', tableLabel: '81-90', value: 16 },
      { id: 'age_91_100', label: '91-100', tableLabel: '91-100', value: 3 }
    ],
    rt: [
      { id: 'rt_1', label: 'RT I', chartLabel: '1', tableLabel: 'RT 1', value: 58 },
      { id: 'rt_2', label: 'RT II', chartLabel: '2', tableLabel: 'RT 2', value: 87 },
      { id: 'rt_3', label: 'RT III', chartLabel: '3', tableLabel: 'RT 3', value: 91 },
      { id: 'rt_4', label: 'RT IV', chartLabel: '4', tableLabel: 'RT 4', value: 75 }
    ],
    education: [
      { id: 'belum_sekolah', label: 'TIDAK / BELUM SEKOLAH', tableLabel: 'Tidak atau belum sekolah', value: 102 },
      { id: 'tamat_sd', label: 'TAMAT SD / SEDERAJAT', tableLabel: 'Tamat SD sederajat', value: 120 },
      { id: 'sltp', label: 'SLTP/SEDERAJAT', tableLabel: 'SLTP sederajat', value: 25 },
      { id: 'slta', label: 'SLTA / SEDERAJAT', tableLabel: 'SLTA sederajat', value: 34 },
      { id: 'diploma_iv_s1', label: 'DIPLOMA IV/ STRATA I', tableLabel: 'Diploma IV atau strata I', value: 2 },
      { id: 'diploma_i_ii', label: 'DIPLOMA I / II', tableLabel: 'Diploma I atau II', value: 1 },
      { id: 'belum_tamat_sd', label: 'BELUM TAMAT SD/SEDERAJAT', tableLabel: 'Belum tamat SD sederajat', value: 26 },
      { id: 'diploma_iii', label: 'AKADEMI/ DIPLOMA III/S. MUDA', tableLabel: 'Akademi atau diploma III/S. Muda', value: 1 }
    ],
    work: [
      { id: 'wiraswasta', label: 'Wiraswasta', tableLabel: 'Wiraswasta', value: 15 },
      { id: 'petani', label: 'Petani/Perkebunan', tableLabel: 'Petani atau perkebunan', value: 126 },
      { id: 'perangkat_desa', label: 'Perangkat Desa', tableLabel: 'Perangkat desa', value: 3 },
      { id: 'pelajar', label: 'Pelajar/Mahasiswa', tableLabel: 'Pelajar atau mahasiswa', value: 45 },
      { id: 'rumah_tangga', label: 'Mengurus Rumah Tangga', tableLabel: 'Mengurus rumah tangga', value: 17 },
      { id: 'karyawan_swasta', label: 'Karyawan Swasta', tableLabel: 'Karyawan swasta', value: 8 },
      { id: 'buruh_tani', label: 'Buruh Tani/Perkebunan', tableLabel: 'Buruh tani atau perkebunan', value: 1 },
      { id: 'buruh_harian', label: 'Buruh Harian Lepas', tableLabel: 'Buruh harian lepas', value: 33 },
      { id: 'belum_bekerja', label: 'Belum/Tidak Bekerja', tableLabel: 'Belum atau tidak bekerja', value: 63 }
    ]
  };

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getFirebaseServices() {
    if (!window.firebase || !window.firebase.apps || !window.firebase.apps.length) {
      return null;
    }

    if (!window.firebase.firestore) {
      return null;
    }

    return {
      db: window.firebase.firestore()
    };
  }

  function toNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.round(number) : fallback;
  }

  function normalizeStats(stats) {
    return {
      population: toNumber(stats.population, defaultStats.population),
      rt: toNumber(stats.rt, defaultStats.rt),
      male: toNumber(stats.male, defaultStats.male),
      female: toNumber(stats.female, defaultStats.female)
    };
  }

  function readStats() {
    return normalizeStats(readJson(dataKey, defaultStats));
  }

  function saveStats(stats) {
    const normalizedStats = normalizeStats(stats);
    localStorage.setItem(dataKey, JSON.stringify(normalizedStats));
    applyStats(document);
    window.dispatchEvent(new CustomEvent('suruKidulDataChange', { detail: normalizedStats }));
    return normalizedStats;
  }

  function normalizeInfographic(data) {
    const source = data || {};

    return Object.keys(defaultInfographic).reduce((normalized, section) => {
      const storedItems = Array.isArray(source[section]) ? source[section] : [];

      normalized[section] = defaultInfographic[section].map((defaultItem) => {
        const storedItem = storedItems.find((item) => item && item.id === defaultItem.id) || {};
        return {
          ...defaultItem,
          value: toNumber(storedItem.value, defaultItem.value)
        };
      });

      return normalized;
    }, {});
  }

  function readInfographic() {
    return normalizeInfographic(readJson(infographicKey, defaultInfographic));
  }

  function saveInfographic(data) {
    const normalizedInfographic = normalizeInfographic(data);
    localStorage.setItem(infographicKey, JSON.stringify(normalizedInfographic));
    applyInfographic(document);
    window.dispatchEvent(
      new CustomEvent('suruKidulInfographicChange', { detail: normalizedInfographic })
    );
    return normalizedInfographic;
  }

  function resetInfographic() {
    localStorage.removeItem(infographicKey);
    applyInfographic(document);
    window.dispatchEvent(
      new CustomEvent('suruKidulInfographicChange', { detail: defaultInfographic })
    );
    return defaultInfographic;
  }

  function resetStats() {
    localStorage.removeItem(dataKey);
    applyStats(document);
    window.dispatchEvent(new CustomEvent('suruKidulDataChange', { detail: defaultStats }));
    return defaultStats;
  }

  function applyStats(root) {
    const stats = readStats();
    const scope = root || document;

    scope.querySelectorAll('[data-site-field]').forEach((element) => {
      const field = element.dataset.siteField;
      if (!Object.prototype.hasOwnProperty.call(stats, field)) {
        return;
      }

      const prefix = element.dataset.prefix || '';
      const suffix = element.dataset.suffix || '';
      element.textContent = `${prefix}${stats[field]}${suffix}`;
    });

    scope.querySelectorAll('[data-gender-pie]').forEach((element) => {
      const totalGender = stats.male + stats.female;
      const maleShare = totalGender > 0 ? `${(stats.male / totalGender) * 100}%` : '50%';
      element.style.setProperty('--male-share', maleShare);
      element.setAttribute(
        'aria-label',
        `Laki-laki ${stats.male} warga dan perempuan ${stats.female} warga.`
      );
    });

    return stats;
  }

  function getPercent(value, items, minimumMax) {
    const maxValue = Math.max(minimumMax || 1, ...items.map((item) => item.value));
    return `${Math.min(100, (value / maxValue) * 100)}%`;
  }

  function updateTableRows(rows, items) {
    rows.forEach((row, index) => {
      const item = items[index];
      if (!item) {
        return;
      }

      const heading = row.querySelector('th');
      const value = row.querySelector('td');

      if (heading) {
        heading.textContent = item.tableLabel || item.label;
      }

      if (value) {
        value.textContent = item.value;
      }
    });
  }

  function updateColumnItems(items, data, minimumMax, labelKey) {
    items.forEach((item, index) => {
      const dataItem = data[index];
      if (!dataItem) {
        return;
      }

      item.style.setProperty('--value', getPercent(dataItem.value, data, minimumMax));
      const value = item.querySelector('strong');
      const label = item.querySelector('em');

      if (value) {
        value.textContent = dataItem.value;
      }

      if (label) {
        label.textContent = dataItem[labelKey] || dataItem.label;
      }
    });
  }

  function updateListItems(items, data, suffix) {
    items.forEach((item, index) => {
      const dataItem = data[index];
      if (!dataItem) {
        return;
      }

      const label = item.querySelector('span');
      const value = item.querySelector('strong');

      if (label) {
        label.textContent = dataItem.label;
      }

      if (value) {
        value.textContent = `${dataItem.value}${suffix || ''}`;
      }
    });
  }

  function applyInfographic(root) {
    const infographic = readInfographic();
    const scope = root || document;
    const ageChart = scope.querySelector('.age-range-chart');
    const rtChart = scope.querySelector('.rt-chart');
    const educationChart = scope.querySelector('.education-section-chart');
    const workChart = scope.querySelector('.work-column-chart');

    updateColumnItems(
      scope.querySelectorAll('.age-range-chart .column-item'),
      infographic.age,
      1,
      'label'
    );
    updateTableRows(
      scope.querySelectorAll('.age-composition-chart-body table tbody tr'),
      infographic.age
    );
    if (ageChart) {
      ageChart.setAttribute(
        'aria-label',
        `Rentang usia warga Padukuhan Surukidul: ${infographic.age
          .map((item) => `${item.tableLabel} tahun ${item.value}`)
          .join(', ')}.`
      );
    }

    updateListItems(scope.querySelectorAll('.hamlet-list div'), infographic.rt, ' Jiwa');
    updateColumnItems(scope.querySelectorAll('.rt-chart .column-item'), infographic.rt, 100, 'chartLabel');
    updateTableRows(scope.querySelectorAll('.rt-panel-chart table tbody tr'), infographic.rt);
    if (rtChart) {
      rtChart.setAttribute(
        'aria-label',
        `Jumlah warga setiap RT Padukuhan Surukidul: ${infographic.rt
          .map((item) => `${item.tableLabel} sebanyak ${item.value}`)
          .join(', ')}.`
      );
    }

    updateColumnItems(
      scope.querySelectorAll('.education-section-chart .education-row'),
      infographic.education,
      1,
      'label'
    );
    updateTableRows(
      scope.querySelectorAll('.education-section-chart-body table tbody tr'),
      infographic.education
    );
    if (educationChart) {
      educationChart.setAttribute(
        'aria-label',
        `Tingkat pendidikan warga Padukuhan Surukidul: ${infographic.education
          .map((item) => `${item.tableLabel} ${item.value}`)
          .join(', ')}.`
      );
    }

    updateListItems(scope.querySelectorAll('.work-list div'), infographic.work, ' Jiwa');
    updateColumnItems(
      scope.querySelectorAll('.work-column-chart .column-item'),
      infographic.work,
      1,
      'label'
    );
    updateTableRows(scope.querySelectorAll('.work-composition-card table tbody tr'), infographic.work);
    if (workChart) {
      workChart.setAttribute(
        'aria-label',
        `Pekerjaan warga Padukuhan Surukidul: ${infographic.work
          .map((item) => `${item.tableLabel} ${item.value}`)
          .join(', ')}.`
      );
    }

    return infographic;
  }

  function isLoggedIn() {
    return localStorage.getItem(sessionKey) === 'active';
  }

  async function login(username, password) {
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();

    if (normalizedUsername !== adminUsername.toLowerCase()) {
      return false;
    }

    if (normalizedPassword === 'admin123') {
      localStorage.setItem(sessionKey, 'active');
      updateAdminState();
      window.dispatchEvent(new CustomEvent('suruKidulAdminChange', { detail: { loggedIn: true } }));
      return true;
    }

    return false;
  }

  async function logout() {
    localStorage.removeItem(sessionKey);
    updateAdminState();
    window.dispatchEvent(new CustomEvent('suruKidulAdminChange', { detail: { loggedIn: false } }));
  }

  function updateAdminState(root) {
    const scope = root || document;
    const loggedIn = isLoggedIn();

    document.body.classList.toggle('admin-is-logged-in', loggedIn);

    scope.querySelectorAll('.admin-nav-link').forEach((link) => {
      link.textContent = loggedIn ? 'Admin' : 'Login Admin';
      link.setAttribute('aria-label', loggedIn ? 'Buka dashboard admin' : 'Login sebagai admin');
    });

    scope.querySelectorAll('[data-admin-only]').forEach((element) => {
      element.hidden = !loggedIn;
    });
  }

  function readPhotos() {
    if (getFirebaseServices() && hasReceivedSharedPhotos) {
      return sharedPhotos.slice();
    }

    const photos = readJson(galleryKey, []);
    return Array.isArray(photos) ? photos : [];
  }

  function savePhotos(photos) {
    const limitedPhotos = photos.slice(-maxPhotos);
    localStorage.setItem(galleryKey, JSON.stringify(limitedPhotos));
    sharedPhotos = limitedPhotos;
    window.dispatchEvent(new CustomEvent('suruKidulGalleryChange', { detail: limitedPhotos }));
    return limitedPhotos;
  }

  async function removePhoto(id) {
    const firebaseServices = getFirebaseServices();

    if (firebaseServices) {
      if (!isLoggedIn()) {
        throw new Error('Admin belum login.');
      }

      await firebaseServices.db.collection('galleryPhotos').doc(id).delete();
      return readPhotos().filter((photo) => photo.id !== id);
    }

    return savePhotos(readPhotos().filter((photo) => photo.id !== id));
  }

  function formatPhotoCaption(file) {
    const fileName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    return fileName ? fileName.slice(0, 64) : 'Foto dari perangkat';
  }

  function cleanPhotoCaption(caption) {
    const cleanedCaption = String(caption || '').replace(/\s+/g, ' ').trim();
    return cleanedCaption ? cleanedCaption.slice(0, 90) : '';
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File bukan gambar.'));
        return;
      }

      const reader = new FileReader();

      reader.onerror = () => reject(new Error('Foto gagal dibaca.'));
      reader.onload = () => {
        const image = new Image();

        image.onerror = () => reject(new Error('Format foto tidak didukung browser.'));
        image.onload = () => {
          const largestEdge = Math.max(image.width, image.height);
          const scale = largestEdge > imageMaxEdge ? imageMaxEdge / largestEdge : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));

          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', imageQuality));
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  async function addPhotoFiles(files, caption) {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'));
    const customCaption = cleanPhotoCaption(caption);

    if (!imageFiles.length) {
      return [];
    }

    const newPhotos = [];
    const firebaseServices = getFirebaseServices();

    if (firebaseServices && !isLoggedIn()) {
      throw new Error('Admin belum login.');
    }

    for (const file of imageFiles) {
      const src = await resizeImage(file);
      const photo = {
        caption: customCaption || formatPhotoCaption(file),
        src
      };

      if (firebaseServices) {
        const reference = await firebaseServices.db.collection('galleryPhotos').add({
          ...photo,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: adminUsername
        });
        newPhotos.push({ id: reference.id, ...photo });
      } else {
        newPhotos.push({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ...photo
        });
      }
    }

    if (!firebaseServices) {
      savePhotos(readPhotos().concat(newPhotos));
    }

    return newPhotos;
  }

  function startSharedGallerySync() {
    const firebaseServices = getFirebaseServices();

    if (!firebaseServices || unsubscribeSharedPhotos) {
      return;
    }

    unsubscribeSharedPhotos = firebaseServices.db
      .collection('galleryPhotos')
      .orderBy('createdAt', 'asc')
      .onSnapshot((snapshot) => {
        sharedPhotos = snapshot.docs
          .map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...documentSnapshot.data()
          }))
          .filter((photo) => photo.src && photo.caption);
        hasReceivedSharedPhotos = true;
        localStorage.setItem(galleryKey, JSON.stringify(sharedPhotos.slice(-maxPhotos)));
        window.dispatchEvent(new CustomEvent('suruKidulGalleryChange', { detail: sharedPhotos }));
      }, () => {
        hasReceivedSharedPhotos = false;
        window.dispatchEvent(new CustomEvent('suruKidulGalleryChange', { detail: readPhotos() }));
      });
  }

  window.SuruKidulAdmin = {
    addPhotoFiles,
    applyStats,
    defaultStats,
    defaultInfographic,
    formatPhotoCaption,
    isLoggedIn,
    login,
    logout,
    readInfographic,
    readPhotos,
    readStats,
    removePhoto,
    resetInfographic,
    resetStats,
    resizeImage,
    saveInfographic,
    savePhotos,
    saveStats,
    updateAdminState
  };

  function initAdminHelpers() {
    sharedPhotos = readJson(galleryKey, []);
    if (document.querySelector('.gallery-modal-grid') || document.getElementById('adminPhotoPreview')) {
      startSharedGallerySync();
    }
    applyStats(document);
    applyInfographic(document);
    updateAdminState(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminHelpers);
  } else {
    initAdminHelpers();
  }

  window.addEventListener('storage', (event) => {
    if (event.key === dataKey) {
      applyStats(document);
    }

    if (event.key === infographicKey) {
      applyInfographic(document);
      window.dispatchEvent(
        new CustomEvent('suruKidulInfographicChange', { detail: readInfographic() })
      );
    }

    if (event.key === sessionKey) {
      updateAdminState(document);
      window.dispatchEvent(
        new CustomEvent('suruKidulAdminChange', { detail: { loggedIn: isLoggedIn() } })
      );
    }

    if (event.key === galleryKey) {
      window.dispatchEvent(new CustomEvent('suruKidulGalleryChange', { detail: readPhotos() }));
    }
  });
})();

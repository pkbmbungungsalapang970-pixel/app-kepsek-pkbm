import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxUKxJa48p3Qw9kmOYEqHXRgbuzJ6eyhDW3Xgkbn1fZhfia5x8B7ZIx9M7d5Wcpa70OGw/exec";

interface Attendance {
  id: number;
  date: string;
  time: string;
  class: string;
  name: string;
  nisn: string;
  photo: string | null;
  status: string;
  mapel: string;
  namaGuru: string;
}

interface MonthlyRecap {
  name: string;
  class: string;
  mapel: string;
  hadir: number;
  alpa: number;
  izin: number;
  sakit: number;
  persenHadir: string;
  namaGuru: string;
}

interface ProcessedAttendance extends Attendance {
  processedPhoto?: string | null;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<"data" | "monthlyRecap">(
    "data"
  );
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [monthlyRecapData, setMonthlyRecapData] = useState<MonthlyRecap[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedGuru, setSelectedGuru] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedMonthRecap, setSelectedMonthRecap] =
    useState<string>("Januari");
  const [selectedClassRecap, setSelectedClassRecap] = useState<string>("Semua");
  const [selectedNameRecap, setSelectedNameRecap] = useState<string>("Semua");

  const [isPolling, setIsPolling] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedGuruRecap, setSelectedGuruRecap] = useState<string>("Semua");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [nip, setNip] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (currentPage === "data") {
      setIsPolling(true);
      fetchAttendanceData(false);

      const pollingInterval = setInterval(() => {
        fetchAttendanceData(false);
      }, 5000);

      return () => {
        clearInterval(pollingInterval);
        setIsPolling(false);
      };
    }
  }, [currentPage]);

  useEffect(() => {
    if (currentPage === "monthlyRecap") {
      fetchMonthlyRecap(selectedMonthRecap);
    }
  }, [currentPage, selectedMonthRecap]);

  const fetchAttendanceData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `${ENDPOINT}?action=getAttendanceData&_t=${Date.now()}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttendanceData(data.data);
          setLastRefresh(new Date());
        } else {
          console.error("Error fetching attendance data:", data.error);
        }
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const fetchMonthlyRecap = async (month: string) => {
    setLoadingRecap(true);
    try {
      const response = await fetch(
        `${ENDPOINT}?action=getMonthlyRecap&month=${month}&_t=${Date.now()}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMonthlyRecapData(data.data);
        } else {
          console.error("Error fetching monthly recap:", data.message);
        }
      }
    } catch (error) {
      console.error("Error fetching monthly recap:", error);
    } finally {
      setLoadingRecap(false);
    }
  };

  useEffect(() => {
    setSelectedNameRecap("Semua");
    // ✅ HAPUS reset guru dari sini! Guru tidak boleh reset saat kelas berubah
  }, [selectedClassRecap]);

  // ✅ TAMBAHKAN useEffect terpisah untuk reset saat bulan berubah
  useEffect(() => {
    setSelectedGuruRecap("Semua");
    setSelectedClassRecap("Semua");
    setSelectedNameRecap("Semua");
  }, [selectedMonthRecap]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (
      username.toUpperCase() === "RAJAMUDDIN, S.PD.I" &&
      nip === "198106132025211014"
    ) {
      setIsLoggedIn(true);
    } else {
      setLoginError("Nama atau NIP salah. Silakan coba lagi.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setNip("");
    setLoginError("");
  };

  const renderDataPage = () => {
    const convertGoogleDriveUrl = (url: string): string => {
      if (url.includes("drive.google.com/file/d/")) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          const fileId = match[1];
          return `https://lh3.googleusercontent.com/d/${fileId}=w1000?authuser=0`;
        }
      }
      return url;
    };

    const convertGoogleDriveUrlAlt = (url: string): string => {
      if (url.includes("drive.google.com/file/d/")) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          const fileId = match[1];
          return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        }
      }
      return url;
    };

    const uniqueClasses = [
      "",
      ...new Set(attendanceData.map((att) => att.class).filter(Boolean)),
    ];

    const downloadPDF = async (): Promise<void> => {
      const button = document.getElementById(
        "downloadPdfButton"
      ) as HTMLButtonElement;
      if (!button) return;

      const originalButtonText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Memproses gambar...
      `;

      try {
        let jsPDF: any;
        if ((window as any).jsPDF) {
          jsPDF = (window as any).jsPDF;
        } else if ((window as any).jspdf && (window as any).jspdf.jsPDF) {
          jsPDF = (window as any).jspdf.jsPDF;
        } else {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js";
          script.onload = () => setTimeout(() => downloadPDF(), 100);
          script.onerror = () => alert("Gagal memuat library jsPDF.");
          document.head.appendChild(script);
          return;
        }

        const doc = new jsPDF();

        const filteredData: Attendance[] = attendanceData.filter(
          (attendance: Attendance) => {
            let matchMonth = true;
            let matchDate = true;
            let matchGuru = true;
            let matchClass = true;

            if (selectedMonth) {
              const [day, month, year] = attendance.date.split("/");
              matchMonth = month === selectedMonth;
            }

            if (selectedDate) {
              const [day, month, year] = attendance.date.split("/");
              const attendanceDate = `${year}-${month.padStart(
                2,
                "0"
              )}-${day.padStart(2, "0")}`;
              matchDate = attendanceDate === selectedDate;
            }

            if (selectedGuru) {
              matchGuru = attendance.namaGuru === selectedGuru;
            }

            if (selectedClass) {
              matchClass = attendance.class === selectedClass;
            }

            return matchMonth && matchDate && matchGuru && matchClass;
          }
        );

        doc.setFontSize(16);
        doc.text("Laporan Data Absensi Siswa", 14, 15);

        let yPosition = 25;

        if (selectedMonth) {
          const monthNames = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
          ];
          const monthName = monthNames[parseInt(selectedMonth) - 1];
          doc.setFontSize(12);
          doc.text(`Bulan: ${monthName}`, 14, yPosition);
          yPosition += 10;
        }

        if (selectedDate) {
          const [year, month, day] = selectedDate.split("-");
          doc.setFontSize(12);
          doc.text(`Tanggal: ${day}/${month}/${year}`, 14, yPosition);
          yPosition += 10;
        }

        if (selectedClass) {
          doc.setFontSize(12);
          doc.text(`Kelas: ${selectedClass}`, 14, yPosition);
          yPosition += 10;
        }

        doc.setFontSize(10);
        doc.text(
          `Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`,
          14,
          yPosition
        );
        yPosition += 10;

        const loadImageFromUrl = (url: string): Promise<string> => {
          return new Promise(async (resolve, reject) => {
            const urlsToTry: string[] = [];
            if (url.includes("drive.google.com/file/d/")) {
              const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
              if (match && match[1]) {
                const fileId = match[1];
                urlsToTry.push(
                  `https://lh3.googleusercontent.com/d/${fileId}=w1000?authuser=0`,
                  `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
                  `https://drive.google.com/uc?export=view&id=${fileId}`,
                  `https://drive.google.com/uc?id=${fileId}`,
                  url
                );
              }
            } else {
              urlsToTry.push(url);
            }

            for (let i = 0; i < urlsToTry.length; i++) {
              const tryUrl = urlsToTry[i];
              try {
                const result = await new Promise<string>((resolve, reject) => {
                  const img = new Image();
                  img.crossOrigin = "anonymous";
                  const timeout = setTimeout(
                    () => reject(new Error("Timeout")),
                    10000
                  );
                  img.onload = () => {
                    clearTimeout(timeout);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return reject(new Error("No context"));
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/jpeg", 0.8));
                  };
                  img.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(error);
                  };
                  img.src = tryUrl;
                });
                resolve(result);
                return;
              } catch (error) {}
            }
            reject(new Error("Failed all URLs"));
          });
        };

        const processImageWithTimeout = async (
          attendance: Attendance,
          timeout: number = 15000
        ): Promise<ProcessedAttendance> => {
          if (!attendance.photo) return { ...attendance, processedPhoto: null };
          return Promise.race([
            (async () => {
              let processedPhoto = attendance.photo;
              if (attendance.photo && attendance.photo.startsWith("https://")) {
                processedPhoto = await loadImageFromUrl(attendance.photo);
              } else if (
                attendance.photo &&
                !attendance.photo.startsWith("data:image")
              ) {
                processedPhoto = await loadImageFromUrl(attendance.photo);
              }
              return { ...attendance, processedPhoto };
            })(),
            new Promise<ProcessedAttendance>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), timeout)
            ),
          ]).catch(() => ({ ...attendance, processedPhoto: null }));
        };

        const processedData: ProcessedAttendance[] = [];
        const batchSize = 3;
        for (let i = 0; i < filteredData.length; i += batchSize) {
          const batch = filteredData.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map((attendance) => processImageWithTimeout(attendance))
          );
          processedData.push(...batchResults);
          if (i + batchSize < filteredData.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        const tableData: (string | number)[][] = processedData.map(
          (attendance: ProcessedAttendance) => {
            let photoStatus = "Tidak ada foto";
            if (attendance.processedPhoto) photoStatus = "Ada foto";
            return [
              attendance.date,
              attendance.time,
              attendance.class,
              attendance.name,
              attendance.nisn,
              photoStatus,
              attendance.status,
              attendance.mapel || "Belum dipilih",
            ];
          }
        );

        doc.autoTable({
          head: [
            [
              "Tanggal",
              "Jam",
              "Kelas",
              "Nama",
              "NISN",
              "Foto",
              "Status",
              "Mapel",
            ],
          ],
          body: tableData,
          startY: yPosition + 5,
          styles: { fontSize: 9, cellPadding: 3, minCellHeight: 20 },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 18 },
            2: { cellWidth: 18 },
            3: { cellWidth: 35 },
            4: { cellWidth: 25 },
            5: { cellWidth: 30 },
            6: { cellWidth: 20 },
            7: { cellWidth: 25 },
          },
          didDrawCell: (data: any) => {
            if (
              data.column.index === 5 &&
              data.row.index >= 0 &&
              data.section === "body"
            ) {
              const attendance = processedData[data.row.index];
              if (attendance && attendance.processedPhoto) {
                try {
                  doc.setFillColor(255, 255, 255);
                  if (data.row.index % 2 !== 0) doc.setFillColor(248, 250, 252);
                  doc.rect(
                    data.cell.x,
                    data.cell.y,
                    data.cell.width,
                    data.cell.height,
                    "F"
                  );
                  const imgWidth = 15;
                  const imgHeight = 15;
                  const x = data.cell.x + (data.cell.width - imgWidth) / 2;
                  const y = data.cell.y + (data.cell.height - imgHeight) / 2;
                  doc.addImage(
                    attendance.processedPhoto,
                    "JPEG",
                    x,
                    y,
                    imgWidth,
                    imgHeight
                  );
                } catch (error) {
                  doc.setFontSize(8);
                  doc.text("Error foto", data.cell.x + 2, data.cell.y + 10);
                }
              } else {
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text("Tidak ada", data.cell.x + 2, data.cell.y + 10);
                doc.setTextColor(0, 0, 0);
              }
            }
          },
        });

        const totalData = filteredData.length;
        const hadirCount = filteredData.filter(
          (a) => a.status === "Hadir"
        ).length;
        const alphaCount = filteredData.filter(
          (a) => a.status === "Alpha"
        ).length;
        const izinCount = filteredData.filter(
          (a) => a.status === "Izin"
        ).length;
        const sakitCount = filteredData.filter(
          (a) => a.status === "Sakit"
        ).length;

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text("Ringkasan:", 14, finalY);
        doc.setFontSize(10);
        doc.text(`Total Data: ${totalData}`, 14, finalY + 10);
        doc.text(`Hadir: ${hadirCount}`, 14, finalY + 20);
        doc.text(`Alpha: ${alphaCount}`, 60, finalY + 20);
        doc.text(`Izin: ${izinCount}`, 100, finalY + 20);
        doc.text(`Sakit: ${sakitCount}`, 140, finalY + 20);

        let fileName = `Absensi_${new Date().getFullYear()}.pdf`;
        if (selectedDate) {
          const [year, month, day] = selectedDate.split("-");
          fileName = `Absensi_${day}-${month}-${year}.pdf`;
        } else if (selectedMonth) {
          const monthNames = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
          ];
          const monthName = monthNames[parseInt(selectedMonth) - 1];
          fileName = `Absensi_${monthName}_${new Date().getFullYear()}.pdf`;
        }

        doc.save(fileName);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Terjadi kesalahan saat membuat PDF.");
      } finally {
        button.disabled = false;
        button.innerHTML = originalButtonText;
      }
    };

    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Data Absensi
              </h2>
              <div className="flex items-center gap-4 mt-2">
                {lastRefresh && (
                  <p className="text-xs text-gray-500">
                    Terakhir diperbarui:{" "}
                    {lastRefresh.toLocaleTimeString("id-ID")}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isPolling ? "bg-green-400" : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-xs text-gray-600">
                    {isPolling ? "Auto-update aktif" : "Auto-update nonaktif"}
                  </span>
                </div>
              </div>
            </div>
            <button
              id="downloadPdfButton"
              onClick={downloadPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded-lg flex items-center gap-2 transition-colors duration-200"
              disabled={loading || attendanceData.length === 0}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter per Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Bulan</option>
                {[
                  "Januari",
                  "Februari",
                  "Maret",
                  "April",
                  "Mei",
                  "Juni",
                  "Juli",
                  "Agustus",
                  "September",
                  "Oktober",
                  "November",
                  "Desember",
                ].map((month, index) => (
                  <option
                    key={String(index + 1).padStart(2, "0")}
                    value={String(index + 1).padStart(2, "0")}
                  >
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter per Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Nama Guru
              </label>
              <select
                value={selectedGuru}
                onChange={(e) => {
                  setSelectedGuru(e.target.value);
                  setSelectedClass(""); // Reset filter kelas ketika guru berubah
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Guru</option>
                {[
                  ...new Set(
                    attendanceData.map((att) => att.namaGuru).filter(Boolean)
                  ),
                ].map((guru) => (
                  <option key={guru} value={guru}>
                    {guru}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Kelas
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Kelas</option>
                {[
                  ...new Set(
                    attendanceData
                      .filter(
                        (att) => !selectedGuru || att.namaGuru === selectedGuru
                      )
                      .map((att) => att.class)
                      .filter(Boolean)
                  ),
                ]
                  .sort((a, b) => {
                    const numA = parseInt(a.match(/\d+/)?.[0] || "0");
                    const numB = parseInt(b.match(/\d+/)?.[0] || "0");
                    return numA - numB;
                  })
                  .map((cls, index) => (
                    <option key={index} value={cls}>
                      {cls}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {(selectedMonth || selectedDate || selectedGuru || selectedClass) && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setSelectedMonth("");
                  setSelectedDate("");
                  setSelectedGuru("");
                  setSelectedClass("");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Hapus Semua Filter
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-200">
                <tr>
                  <th className="px-4 py-2">Tanggal</th>
                  <th className="px-4 py-2">Jam</th>
                  <th className="px-4 py-2">Kelas</th>
                  <th className="px-4 py-2">Nama</th>
                  <th className="px-4 py-2">NISN</th>
                  <th className="px-4 py-2">Foto</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Mapel</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Tidak ada data absensi
                    </td>
                  </tr>
                ) : (
                  attendanceData
                    .filter((attendance: Attendance) => {
                      let matchMonth = true;
                      let matchDate = true;
                      let matchGuru = true;
                      let matchClass = true;

                      if (selectedMonth) {
                        const [day, month, year] = attendance.date.split("/");
                        matchMonth = month === selectedMonth;
                      }

                      if (selectedDate) {
                        const [day, month, year] = attendance.date.split("/");
                        const attendanceDate = `${year}-${month.padStart(
                          2,
                          "0"
                        )}-${day.padStart(2, "0")}`;
                        matchDate = attendanceDate === selectedDate;
                      }

                      if (selectedGuru) {
                        matchGuru = attendance.namaGuru === selectedGuru;
                      }

                      if (selectedClass) {
                        matchClass = attendance.class === selectedClass;
                      }

                      return matchMonth && matchDate && matchGuru && matchClass;
                    })
                    .map((attendance: Attendance, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{attendance.date}</td>
                        <td className="px-4 py-2">{attendance.time}</td>
                        <td className="px-4 py-2">{attendance.class}</td>
                        <td className="px-4 py-2">{attendance.name}</td>
                        <td className="px-4 py-2">{attendance.nisn}</td>
                        <td className="px-4 py-2">
                          {attendance.photo ? (
                            attendance.photo.startsWith("https://") ? (
                              attendance.photo.includes("drive.google.com") ? (
                                <div className="flex flex-col items-center">
                                  <img
                                    src={convertGoogleDriveUrl(
                                      attendance.photo
                                    )}
                                    alt="Foto siswa"
                                    className="w-12 h-12 object-cover rounded-full border-2 border-gray-300 mb-1"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      if (attendance.photo) {
                                        target.src = convertGoogleDriveUrlAlt(
                                          attendance.photo
                                        );
                                        target.onerror = () => {
                                          target.style.display = "none";
                                          const parent = target.parentElement;
                                          if (parent) {
                                            const span =
                                              document.createElement("span");
                                            span.className =
                                              "text-xs text-gray-500";
                                            span.textContent = "Preview gagal";
                                            parent.appendChild(span);
                                          }
                                        };
                                      }
                                    }}
                                  />
                                  <a
                                    href={attendance.photo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                                  >
                                    Buka Foto
                                  </a>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <img
                                    src={attendance.photo}
                                    alt="Foto siswa"
                                    className="w-12 h-12 object-cover rounded-full border-2 border-gray-300 mb-1"
                                  />
                                  <a
                                    href={attendance.photo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                                  >
                                    Link
                                  </a>
                                </div>
                              )
                            ) : (
                              <img
                                src={attendance.photo}
                                alt="Foto siswa"
                                className="w-12 h-12 object-cover rounded-full border-2 border-gray-300"
                              />
                            )
                          ) : (
                            <span className="text-gray-500">
                              Tidak ada foto
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              attendance.status === "Hadir"
                                ? "bg-green-100 text-green-800"
                                : attendance.status === "Alpha"
                                ? "bg-red-100 text-red-800"
                                : attendance.status === "Izin"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {attendance.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {attendance.mapel || "Belum dipilih"}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderMonthlyRecapPage = () => {
    // ✅ 1. DEKLARASI uniqueGurus DULU (harus di atas uniqueClasses)
    const uniqueGurus = [
      "Semua",
      ...new Set(monthlyRecapData.map((r) => r.namaGuru).filter(Boolean)),
    ];

    // ✅ 2. uniqueClasses menggunakan selectedGuruRecap
    const uniqueClasses = [
      "Semua",
      ...Array.from(
        new Set(
          monthlyRecapData
            .filter(
              (r) =>
                selectedGuruRecap === "Semua" ||
                r.namaGuru === selectedGuruRecap
            )
            .map((r) => r.class)
        )
      ).sort((a, b) => {
        // ✅ Extract angka dari nama kelas (misal: "5" dari "5", "10" dari "10 A")
        const numA = parseInt(a.match(/\d+/)?.[0] || "0");
        const numB = parseInt(b.match(/\d+/)?.[0] || "0");

        if (numA !== numB) {
          return numA - numB; // Sort berdasarkan angka
        }

        // Jika angka sama, sort berdasarkan huruf (misal: "5 A" < "5 B")
        return a.localeCompare(b);
      }),
    ];

    const filteredNames = [
      "Semua",
      ...new Set(
        monthlyRecapData
          .filter((recap) => {
            const guruMatch =
              selectedGuruRecap === "Semua" ||
              recap.namaGuru === selectedGuruRecap;
            const classMatch =
              selectedClassRecap === "Semua" ||
              recap.class === selectedClassRecap;
            return guruMatch && classMatch; // ✅ Filter nama berdasarkan guru dan kelas
          })
          .map((recap) => recap.name)
      ),
    ];

    const filteredData = monthlyRecapData.filter((recap) => {
      const guruMatch =
        selectedGuruRecap === "Semua" || recap.namaGuru === selectedGuruRecap;
      const classMatch =
        selectedClassRecap === "Semua" || recap.class === selectedClassRecap;
      const nameMatch =
        selectedNameRecap === "Semua" || recap.name === selectedNameRecap;
      return guruMatch && classMatch && nameMatch; // ✅ Hapus mapelMatch, tambahkan guruMatch
    });

    const downloadPDFRecap = async (): Promise<void> => {
      const button = document.getElementById(
        "downloadPdfRecapButton"
      ) as HTMLButtonElement;
      if (!button) return;

      const originalButtonText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Memproses...
      `;

      try {
        let jsPDF: any;
        if ((window as any).jsPDF) {
          jsPDF = (window as any).jsPDF;
        } else if ((window as any).jspdf && (window as any).jspdf.jsPDF) {
          jsPDF = (window as any).jspdf.jsPDF;
        } else {
          alert("Library jsPDF tidak tersedia.");
          return;
        }

        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text(`Rekap Absensi Bulanan - ${selectedMonthRecap}`, 14, 15);

        let yPosition = 25;
        doc.setFontSize(12);
        if (selectedClassRecap !== "Semua") {
          doc.text(`Kelas: ${selectedClassRecap}`, 14, yPosition);
          yPosition += 10;
        }
        if (selectedNameRecap !== "Semua") {
          doc.text(`Nama: ${selectedNameRecap}`, 14, yPosition);
          yPosition += 10;
        }
        if (selectedNameRecap !== "Semua") {
          doc.text(`Mapel: ${selectedNameRecap}`, 14, yPosition);
          yPosition += 10;
        }
        doc.setFontSize(10);
        doc.text(
          `Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`,
          14,
          yPosition
        );
        yPosition += 10;

        const tableData = filteredData.map((recap) => [
          recap.name,
          recap.class,
          recap.mapel || "Belum dipilih",
          recap.hadir,
          recap.alpa,
          recap.izin,
          recap.sakit,
          `${recap.persenHadir}%`,
        ]);

        doc.autoTable({
          head: [
            [
              "Nama",
              "Kelas",
              "Mapel",
              "Hadir",
              "Alpa",
              "Izin",
              "Sakit",
              "% Hadir",
            ],
          ],
          body: tableData,
          startY: yPosition + 5,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 35 }, // Sesuaikan lebar jika perlu (Nama)
            1: { cellWidth: 20 }, // Kelas
            2: { cellWidth: 30 }, // Mapel (baru, sesuaikan lebar)
            3: { cellWidth: 15 }, // Hadir (perkecil untuk akomodasi kolom baru)
            4: { cellWidth: 15 }, // Alpa
            5: { cellWidth: 15 }, // Izin
            6: { cellWidth: 15 }, // Sakit
            7: { cellWidth: 20 }, // % Hadir (ubah index dari 6 jadi 7)
          },
        });

        const totalHadir = filteredData.reduce((sum, r) => sum + r.hadir, 0);
        const totalAlpa = filteredData.reduce((sum, r) => sum + r.alpa, 0);
        const totalIzin = filteredData.reduce((sum, r) => sum + r.izin, 0);
        const totalSakit = filteredData.reduce((sum, r) => sum + r.sakit, 0);
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text("Ringkasan:", 14, finalY);
        doc.setFontSize(10);
        doc.text(`Total Hadir: ${totalHadir}`, 14, finalY + 10);
        doc.text(`Total Alpa: ${totalAlpa}`, 14, finalY + 20);
        doc.text(`Total Izin: ${totalIzin}`, 60, finalY + 20);
        doc.text(`Total Sakit: ${totalSakit}`, 100, finalY + 20);

        let fileName = `Rekap_Bulanan_${selectedMonthRecap}.pdf`;
        if (selectedNameRecap !== "Semua") {
          fileName = `Rekap_Bulanan_${selectedMonthRecap}_${selectedNameRecap}.pdf`;
        }
        doc.save(fileName);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Terjadi kesalahan saat membuat PDF.");
      } finally {
        button.disabled = false;
        button.innerHTML = originalButtonText;
      }
    };

    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Rekap Absensi Bulanan
          </h2>
          <button
            id="downloadPdfRecapButton"
            onClick={downloadPDFRecap}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            disabled={loadingRecap || filteredData.length === 0}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* ✅ 1. Filter Bulan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bulan
            </label>
            <select
              value={selectedMonthRecap}
              onChange={(e) => setSelectedMonthRecap(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[
                "Januari",
                "Februari",
                "Maret",
                "April",
                "Mei",
                "Juni",
                "Juli",
                "Agustus",
                "September",
                "Oktober",
                "November",
                "Desember",
              ].map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ 2. Filter Nama Guru (DIPINDAH KE POSISI 2) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Guru
            </label>
            <select
              value={selectedGuruRecap}
              onChange={(e) => {
                setSelectedGuruRecap(e.target.value);
                setSelectedClassRecap("Semua"); // Reset kelas saat guru berubah
                setSelectedNameRecap("Semua"); // Reset nama siswa juga
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueGurus.map((guru) => (
                <option key={guru} value={guru}>
                  {guru || "Belum dipilih"}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ 3. Filter Kelas (MUNCUL SETELAH GURU DIPILIH) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kelas
            </label>
            <select
              value={selectedClassRecap}
              onChange={(e) => {
                setSelectedClassRecap(e.target.value);
                setSelectedNameRecap("Semua"); // Reset nama siswa saat kelas berubah
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={selectedGuruRecap === "Semua"} // ✅ DISABLE jika belum pilih guru
            >
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
            {selectedGuruRecap === "Semua" && (
              <p className="text-xs text-gray-500 mt-1">
                Pilih guru terlebih dahulu
              </p>
            )}
          </div>

          {/* ✅ 4. Filter Nama Siswa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Siswa
            </label>
            <select
              value={selectedNameRecap}
              onChange={(e) => setSelectedNameRecap(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={selectedGuruRecap === "Semua"} // ✅ DISABLE jika belum pilih guru
            >
              {filteredNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {selectedGuruRecap === "Semua" && (
              <p className="text-xs text-gray-500 mt-1">
                Pilih guru terlebih dahulu
              </p>
            )}
          </div>
        </div>

        {loadingRecap ? (
          <div className="text-center py-8">⏳ Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-200">
                <tr>
                  <th className="px-4 py-2">Nama</th>
                  <th className="px-4 py-2">Kelas</th>
                  <th className="px-4 py-2">Mapel</th>
                  <th className="px-4 py-2">Hadir</th>
                  <th className="px-4 py-2">Alpa</th>
                  <th className="px-4 py-2">Izin</th>
                  <th className="px-4 py-2">Sakit</th>
                  <th className="px-4 py-2">% Hadir</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Tidak ada data rekap untuk filter ini
                    </td>
                  </tr>
                ) : (
                  filteredData.map((recap, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{recap.name}</td>
                      <td className="px-4 py-2">{recap.class}</td>
                      <td className="px-4 py-2">
                        {recap.mapel || "Belum dipilih"}
                      </td>
                      <td className="px-4 py-2">{recap.hadir}</td>
                      <td className="px-4 py-2">{recap.alpa}</td>
                      <td className="px-4 py-2">{recap.izin}</td>
                      <td className="px-4 py-2">{recap.sakit}</td>
                      <td className="px-4 py-2">{recap.persenHadir}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      {!isLoggedIn ? (
        <div className="relative py-3 sm:max-w-md sm:mx-auto w-full max-w-md mx-auto px-4">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Login</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIP
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              {loginError && (
                <p className="text-red-600 text-sm mb-4">{loginError}</p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="relative py-3 sm:max-w-4xl sm:mx-auto w-full max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex justify-center">
              <div className="bg-white rounded-lg shadow-lg p-1 flex">
                <button
                  onClick={() => setCurrentPage("data")}
                  className={`px-6 py-2 rounded-md transition duration-200 ${
                    currentPage === "data"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  📊 Data Absensi
                </button>
                <button
                  onClick={() => setCurrentPage("monthlyRecap")}
                  className={`px-6 py-2 rounded-md transition duration-200 ${
                    currentPage === "monthlyRecap"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  📅 Rekap Bulanan
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
          {currentPage === "data" ? renderDataPage() : renderMonthlyRecapPage()}
        </div>
      )}
    </div>
  );
};

export default App;

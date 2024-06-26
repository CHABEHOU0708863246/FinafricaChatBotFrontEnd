import { HttpClientModule } from '@angular/common/http';
import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InsurancePack } from './core/models/InsurancePack';
import { VehicleInfo } from './core/models/VehicleInfo';
import { FleetQuoteService, RiskCategory } from './core/services/fleet-quote.service';
import { format, Locale } from 'date-fns';
import { VehicleInfoRequest } from './core/models/VehicleInfoRequest';
import * as XLSX from 'xlsx';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      transition('void => *', animate('500ms ease-in')) // Transition en fondu entrant
    ])
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    FleetQuoteService
  ],
})
export class AppComponent implements OnInit, AfterViewChecked {

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatbotContainer') chatbotContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('toggleChatbotButton') toggleChatbotButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef;

  collapsed: boolean = false;

  vehicleInfo: VehicleInfo = {
    category: '',
    usage: '',
    genre: '',
    fiscalPower: 0,
    energyType: '',
    seatNumber: 0,
    newValue: 0,
    marketValue: 0,
    hasTrailer: false,
    firstRegistrationDate: new Date(),
    contractDuration: 0
  };

  insurancePacks: InsurancePack[] = [];
  totalPremium: number = 0;

  chatMessages: { sender: 'bot' | 'user', message: string }[] = [];

  currentStep: number = 0;

  currentQuestionIndex: number = 0;

  vehicleQuestions: string[] = [
    '1. Catégorie du véhicule (Exemple : Catégorie 1) :',
    '2. Usage du véhicule (Exemple : privé, professionnel, auto-école, location, etc.) :',
    '3. Genre du véhicule (Exemple : tourisme, utilitaire a corrosserie, etc.) :',
    '4. Puissance fiscale du véhicule (Exemple : 25, en CV) :',
    '5. Type d\'énergie du véhicule (Exemple : essence ou diesel) :',
    '6. Nombre de places dans le véhicule (Exemple : 10) :',
    '7. Valeur à neuf du véhicule (prix auquel le vehicule a été acheté en FCFA) :',
    '8. Valeur de marché du véhicule (prix auquel le vehicule pourrait être vendu sur le marché en FCFA) :',
    '9. Indiquez si le véhicule possède une remorque (oui/non) :',
    '10. Date de première immatriculation du véhicule (JJ/MM/AAAA, Exemple : 12/01/0000) :',
    '11. Durée du contrat d\'assurance souhaitée (en mois, Exemple : vous pouvez saisir soit 3, 6 ou 12 uniquement) :'
  ];


  initialOptions: string[] = [
    '1. Obtenir une simulation de tarification pour un véhicule particulier',
    '2. Obtenir une simulation de tarification pour une flotte de véhicules',
    '3. Comparer les offres d\'assurance',
    '4. Gérer mon contrat d\'assurance',
    '5. Parler à un conseiller',
    '6. En savoir plus sur OAV Finafrica'
  ];




  constructor(private fleetQuoteService: FleetQuoteService) { }


  ngOnInit() {
    setTimeout(() => {
      this.sendBotMessage('Bonjour ! Je suis Leila, votre assistant pour la tarification d\'assurance automobile. Comment puis-je vous aider aujourd\'hui ?');
    }, 200);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  toggleChatbot() {
    this.collapsed = !this.collapsed;
    const chatbotContainer = document.querySelector('.chatbot-container');
    if (chatbotContainer) {
      chatbotContainer.classList.toggle('collapsed', this.collapsed);
    }
  }

  resetPage() {
    window.location.reload();
  }


  sendUserMessage(message: string) {
    const cleanedMessage = message.replace(/\n/g, '');
    this.chatMessages.push({ sender: 'user', message: cleanedMessage });
    this.processUserMessage(cleanedMessage);
    this.scrollToBottom();
  }


  sendBotMessage(message: string) {
    this.chatMessages.push({ sender: 'bot', message });
    this.scrollToBottom();
  }

  async processUserMessage(message: string) {
    if (this.currentStep === 1) {
      this.collectVehicleInfoStep(message);
    } else {
      switch (message) {
        case '1. Obtenir une simulation de tarification pour un véhicule particulier':
          this.currentStep = 1;
          this.sendBotMessage('Parfait ! Commençons la simulation. Veuillez fournir les informations suivantes :');
          this.sendBotMessage(this.vehicleQuestions[this.currentQuestionIndex]);
          break;
        case '2. Obtenir une simulation de tarification pour une flotte de véhicules':
          this.sendBotMessage('Fonctionnalité en cours de développement.');
          break;
        case '3. Comparer les offres d\'assurance':
          this.sendBotMessage('Fonctionnalité en cours de développement.');
          break;
        case '4. Gérer mon contrat d\'assurance':
          this.sendBotMessage('Fonctionnalité en cours de développement.');
          break;
        case '5. Parler à un conseiller':
          this.contactAdvisor();
          break;
        case '6. En savoir plus sur OAV Finafrica':
            this.provideInfoAboutOAVFinafrica();
            break;
            default:
              this.handleGeneralInquiry(message);
              break;
      }
    }
  }


  provideInfoAboutOAVFinafrica() {
    const info = `OAV Finafrica est un outil digital d'aide à la vente de produits d'assurances développé par Finafrica, une filiale du Groupe Duval spécialisée dans l'inclusion financière et assurantielle en Afrique.

  Principales fonctionnalités :
  - Tarification et devis rapides
  - Gestion des dossiers clients
  - Support commercial
  - Formation en ligne

  Avantages :
  - Gain de temps et d'efficacité pour les agents d'assurance
  - Amélioration de la qualité du conseil
  - Augmentation des ventes de produits d'assurance

  Que souhaitez-vous savoir de plus sur OAV Finafrica ?`;

    this.sendBotMessage(info);
  }

  handleGeneralInquiry(message: string) {
    // Vous pouvez implémenter ici une logique plus avancée pour analyser la question
    // et fournir une réponse appropriée. Pour l'instant, nous allons simplement
    // renvoyer à l'utilisateur vers les options principales.

    this.sendBotMessage("Je n'ai pas bien compris votre demande. Pouvez-vous reformuler ou choisir parmi les options suivantes :");
    // this.resetOptions();
  }



  askNextVehicleQuestion() {
    if (this.currentQuestionIndex < this.vehicleQuestions.length) {
      this.sendBotMessage(`Réflexion en cours...`);
      setTimeout(() => {
        this.sendBotMessage(`Veuillez fournir les informations suivantes pour votre véhicule : ${this.vehicleQuestions[this.currentQuestionIndex]}`);
      }, 1500);
    } else {
      this.currentStep = 0;
      this.simulateTarification();
    }
  }


  cleanInput(input: string): string {
    return input.replace(/\n/g, '');
  }

  async collectVehicleInfoStep(message: string) {
    switch (this.currentQuestionIndex) {
      case 0:
        this.vehicleInfo.category = this.cleanInput(message);
        break;
      case 1:
        this.vehicleInfo.usage = this.cleanInput(message);
        break;
      case 2:
        this.vehicleInfo.genre = this.cleanInput(message);
        break;
      case 3:
        this.vehicleInfo.fiscalPower = parseInt(message, 10);
        break;
      case 4:
        this.vehicleInfo.energyType = message;
        break;
      case 5:
        this.vehicleInfo.seatNumber = parseInt(message, 10);
        break;
      case 6:
        this.vehicleInfo.newValue = parseFloat(message);
        break;
      case 7:
        this.vehicleInfo.marketValue = parseFloat(message);
        break;
      case 8:
        this.vehicleInfo.hasTrailer = message.toLowerCase() === 'true';
        break;
      case 9:
        const dateParts = message.split('/');
        this.vehicleInfo.firstRegistrationDate = new Date(parseInt(dateParts[2], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[0], 10)).toISOString();
        break;
      case 10:
        this.vehicleInfo.contractDuration = parseInt(message, 10);
        await this.calculatePremium();
        return;
    }
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex < this.vehicleQuestions.length) {
      this.sendBotMessage(this.vehicleQuestions[this.currentQuestionIndex]);
    }
  }

  async calculatePremium() {
    try {
      const premium = await this.fleetQuoteService.calculateInsurancePremium(this.vehicleInfo).toPromise();
      if (premium !== undefined) {
        this.totalPremium = premium;
        const formattedPremium = premium.toLocaleString('fr-FR');
        this.sendBotMessage(`Le montant total de votre prime d'assurance est de ${formattedPremium} FCFA.`);
        await this.fetchInsurancePacks();
      } else {
        this.sendBotMessage('Erreur lors du calcul de la prime d\'assurance. Prime non définie.');
      }
    } catch (error) {
      console.error('Erreur lors du calcul de la prime d\'assurance :', error);
      this.sendBotMessage('Erreur lors du calcul de la prime d\'assurance. Veuillez vérifier les informations fournies et réessayer.');
    }
  }


  async fetchInsurancePacks() {
    const totalBonusPoints = 100; // Exemple de valeur
    const riskCategory = RiskCategory.LowRisk; // Exemple de catégorie de risque

    this.fleetQuoteService.getInsurancePacks(totalBonusPoints, riskCategory)
      .subscribe(
        (packs) => {
          if (packs) {
            this.insurancePacks = packs; // Assignation après vérification de nullité
          } else {
            console.error('Erreur : la réponse des packs d\'assurance est nulle.');
          }
        },
        (error) => {
          console.error('Erreur lors de la récupération des packs d\'assurance : ', error);
        }
      );
  }

  collectFleetInfo(event: any) {
    const file: File = event.target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const workbook: XLSX.WorkBook = XLSX.read(e.target.result, { type: 'binary' });
      const sheetName: string = workbook.SheetNames[0];
      const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

      const fleetData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log(fleetData);


      this.sendBotMessage(`Données de flotte importées avec succès depuis le fichier Excel.`);
      this.currentStep = 0;
    };

    reader.readAsBinaryString(file);
  }

  contactAdvisor() {
    this.currentStep = 2;
    const advisorInfo = {
      name: 'Mme Leila de finafrica',
      email: 'support@finafrica.com'
    };

    this.sendBotMessage(`Une conseillère, ${advisorInfo.name}, sera avec vous sous peu.`);
    this.sendBotMessage(`Vous pouvez le contacter à l'adresse e-mail : ${advisorInfo.email}.`);

  }

  simulateTarification() {
    const vehicleInfoForRequest: VehicleInfo = {
      ...this.vehicleInfo,
      firstRegistrationDate: this.vehicleInfo.firstRegistrationDate.toString()
    };

    this.fleetQuoteService.calculateInsurancePremium(vehicleInfoForRequest)
      .subscribe(
        (premium) => {
          this.totalPremium = premium;
          this.sendBotMessage(`Le coût total de votre prime d'assurance est de ${premium} FCFA. Voulez-vous procéder au paiement ?`);
        },
        (error) => {
          console.error('Erreur lors de la simulation de tarification:', error);
          this.sendBotMessage('Une erreur est survenue lors de la simulation de tarification. Veuillez réessayer plus tard.');
        }
      );
}


  sendMessage() {
    const messageText = this.messageInput.nativeElement.value.trim();
    if (messageText) {
      this.sendUserMessage(messageText);
      this.messageInput.nativeElement.value = '';
    }
  }


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Process the file here
      this.sendBotMessage(`Fichier sélectionné : ${file.name}`);
    }
  }


  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    // Logique pour uploader le fichier
    console.log('File uploaded:', file);
    this.chatMessages.push({ sender: 'user', message: `Fichier uploadé: ${file.name}` });
    this.fileInput.nativeElement.value = '';
  }





}
